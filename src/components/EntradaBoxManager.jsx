import { useState, useEffect } from 'react';
import { api, getToken } from '../lib/api';
import ConfirmModal from './ConfirmModal';

export default function EntradaBoxManager({ eventId }) {
  const [boxes, setBoxes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', ticketTypeId: '', quantity: 2, price: '', maxBoxes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    load();
  }, []);

  async function load() {
    try {
      const [evtData, tix, boxData] = await Promise.all([
        api.getEvent(eventId),
        api.getTicketTypes(eventId),
        api.getEntradaBoxes(eventId),
      ]);
      setEvent(evtData.event || evtData);
      const ticketList = Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || [];
      setTickets(ticketList);
      const boxList = Array.isArray(boxData) ? boxData : boxData.boxes || boxData.data || [];
      setBoxes(boxList);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function getTicketById(id) { return tickets.find(t => t.id === id); }

  function calcSavings(ticketTypeId, quantity, boxPrice) {
    const ticket = getTicketById(ticketTypeId);
    if (!ticket) return null;
    const individualTotal = Number(ticket.price) * Number(quantity);
    const savings = individualTotal - Number(boxPrice);
    return savings > 0 ? savings : null;
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const body = {
        eventId,
        name: form.name,
        ticketTypeId: form.ticketTypeId,
        quantity: Number(form.quantity),
        price: Number(form.price),
      };
      if (form.description) body.description = form.description;
      if (form.maxBoxes) body.maxBoxes = Number(form.maxBoxes);
      await api.createEntradaBox(body);
      setForm({ name: '', description: '', ticketTypeId: '', quantity: 2, price: '', maxBoxes: '' });
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  function startEdit(b) {
    setEditingId(b.id);
    setEditForm({
      name: b.name,
      description: b.description || '',
      ticketTypeId: b.ticketTypeId,
      quantity: b.quantity,
      price: Number(b.price),
      maxBoxes: b.maxBoxes || '',
    });
  }

  async function saveEdit() {
    setError(''); setSaving(true);
    try {
      const body = {
        name: editForm.name,
        ticketTypeId: editForm.ticketTypeId,
        quantity: Number(editForm.quantity),
        price: Number(editForm.price),
      };
      if (editForm.description) body.description = editForm.description;
      if (editForm.maxBoxes) body.maxBoxes = Number(editForm.maxBoxes);
      await api.updateEntradaBox(editingId, body);
      setEditingId(null);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  async function confirmDelete() {
    setError('');
    try {
      await api.deleteEntradaBox(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (err) { setError(err.message); setDeleteTarget(null); }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="dash-content">
      <a href={`/dashboard/events/${eventId}`} className="back-link">← Volver al evento</a>
      <h1 className="dash-title">📦 Entrada Boxes</h1>
      <p className="dash-subtitle">{event?.title}</p>
      <p style={{ color: 'var(--white-40)', fontSize: '0.9rem', marginBottom: 24 }}>
        Crea paquetes de entradas con precio especial para grupos.
      </p>

      {error && <div className="error-msg">{error}</div>}

      <div className="events-header">
        <h2>{boxes.length} box{boxes.length !== 1 ? 'es' : ''}</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Crear Box'}
        </button>
      </div>

      {showForm && (
        <div className="form-card eb-form-card">
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Box</label>
                <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ej: Box Amigos x4" required />
              </div>
              <div className="form-group">
                <label>Tipo de Entrada</label>
                <select className="form-input" value={form.ticketTypeId} onChange={e => update('ticketTypeId', e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {tickets.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — S/ {Number(t.price).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad de entradas</label>
                <input type="number" min="2" className="form-input" value={form.quantity} onChange={e => update('quantity', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Precio del Box (S/)</label>
                <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => update('price', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Descripción <span style={{ color: 'var(--white-40)' }}>(opcional)</span></label>
                <input className="form-input" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Ej: Incluye 4 entradas General" />
              </div>
              <div className="form-group">
                <label>Máx. Boxes disponibles <span style={{ color: 'var(--white-40)' }}>(opcional)</span></label>
                <input type="number" min="1" className="form-input" value={form.maxBoxes} onChange={e => update('maxBoxes', e.target.value)} placeholder="Sin límite" />
              </div>
            </div>

            {form.ticketTypeId && form.price && form.quantity >= 2 && (() => {
              const savings = calcSavings(form.ticketTypeId, form.quantity, form.price);
              const ticket = getTicketById(form.ticketTypeId);
              if (!ticket) return null;
              const individualTotal = Number(ticket.price) * Number(form.quantity);
              return (
                <div className="eb-savings-preview">
                  <div className="eb-savings-row">
                    <span>Precio individual: {form.quantity} × S/ {Number(ticket.price).toFixed(2)}</span>
                    <span>S/ {individualTotal.toFixed(2)}</span>
                  </div>
                  <div className="eb-savings-row">
                    <span>Precio del box</span>
                    <span className="eb-box-price">S/ {Number(form.price).toFixed(2)}</span>
                  </div>
                  {savings ? (
                    <div className="eb-savings-row eb-savings-highlight">
                      <span>🎉 Ahorro por box</span>
                      <span>S/ {savings.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="eb-savings-row eb-savings-warn">
                      <span>⚠️ Sin ahorro — el box cuesta igual o más</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <button type="submit" className="btn-primary btn-sm" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Creando...' : '📦 Crear Box'}
            </button>
          </form>
        </div>
      )}

      {boxes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-60)' }}>
          No hay boxes creados aún. Crea uno para ofrecer descuentos grupales.
        </div>
      ) : (
        boxes.map(b => {
          const ticket = getTicketById(b.ticketTypeId);
          const savings = ticket ? calcSavings(b.ticketTypeId, b.quantity, b.price) : null;
          const individualTotal = ticket ? Number(ticket.price) * b.quantity : 0;

          return (
            <div key={b.id} className="ticket-type-card eb-box-card">
              {editingId === b.id ? (
                <div style={{ width: '100%' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Tipo de Entrada</label>
                      <select className="form-input" value={editForm.ticketTypeId} onChange={e => setEditForm(f => ({ ...f, ticketTypeId: e.target.value }))}>
                        {tickets.map(t => (
                          <option key={t.id} value={t.id}>{t.name} — S/ {Number(t.price).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cantidad</label>
                      <input type="number" min="2" className="form-input" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Precio (S/)</label>
                      <input type="number" step="0.01" className="form-input" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Descripción</label>
                      <input className="form-input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Máx. Boxes</label>
                      <input type="number" min="1" className="form-input" value={editForm.maxBoxes} onChange={e => setEditForm(f => ({ ...f, maxBoxes: e.target.value }))} placeholder="Sin límite" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : '✓ Guardar'}</button>
                    <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ticket-type-info">
                    <h4>
                      📦 {b.name}
                      <span className="eb-qty-badge">x{b.quantity} entradas</span>
                    </h4>
                    <div className="ticket-type-meta">
                      {ticket ? ticket.name : 'Tipo eliminado'}
                      {b.description ? ` · ${b.description}` : ''}
                    </div>
                    <div className="ticket-sold">
                      {b.soldBoxes || 0}{b.maxBoxes ? ` / ${b.maxBoxes}` : ''} vendidos
                    </div>
                    {savings && (
                      <div className="eb-savings-badge">
                        🎉 Ahorro: S/ {savings.toFixed(2)} por box
                        <span className="eb-savings-pct">({((savings / individualTotal) * 100).toFixed(0)}% off)</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="ticket-price">S/ {Number(b.price).toFixed(2)}</div>
                    <button className="btn-ghost btn-sm" onClick={() => startEdit(b)} title="Editar">✏️</button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(b.id)}
                      title={(b.soldBoxes || 0) > 0 ? 'No se puede eliminar (tiene ventas)' : 'Eliminar'}
                      style={{
                        borderColor: (b.soldBoxes || 0) > 0 ? 'var(--white-10)' : 'var(--coral, #f87171)',
                        color: (b.soldBoxes || 0) > 0 ? 'var(--white-40)' : 'var(--coral, #f87171)',
                      }}
                      disabled={(b.soldBoxes || 0) > 0}
                    >🗑️</button>
                  </div>
                </>
              )}
            </div>
          );
        })
      )}

      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <a href={`/dashboard/events/${eventId}/tickets`} className="btn-ghost">🎟️ Tipos de Entrada</a>
        <a href={`/dashboard/events/${eventId}/stats`} className="btn-ghost">📊 Estadísticas</a>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="¿Eliminar este box?"
        message="Esta acción no se puede deshacer. Solo se pueden eliminar boxes sin ventas."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

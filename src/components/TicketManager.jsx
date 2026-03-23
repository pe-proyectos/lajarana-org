import { useState, useEffect } from 'react';
import { api, getToken } from '../lib/api';
import ConfirmModal from './ConfirmModal';

export default function TicketManager({ eventId }) {
  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', quantity: '', description: '', salesStartDate: '', salesEndDate: '' });
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
      const [evtData, tix] = await Promise.all([api.getEvent(eventId), api.getTicketTypes(eventId)]);
      setEvent(evtData.event || evtData);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const body = {
        eventId, name: form.name, price: Number(form.price),
        quantity: Number(form.quantity), description: form.description || undefined,
      };
      if (form.salesStartDate) body.salesStart = new Date(form.salesStartDate).toISOString();
      if (form.salesEndDate) body.salesEnd = new Date(form.salesEndDate).toISOString();
      await api.createTicketType(body);
      setForm({ name: '', price: '', quantity: '', description: '', salesStartDate: '', salesEndDate: '' });
      setShowForm(false);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      name: t.name, price: Number(t.price), quantity: t.quantity,
      description: t.description || '', salesStart: t.salesStart ? t.salesStart.slice(0, 16) : '',
      salesEnd: t.salesEnd ? t.salesEnd.slice(0, 16) : '',
    });
  }

  async function saveEdit() {
    setError(''); setSaving(true);
    try {
      const body = { ...editForm, price: Number(editForm.price), quantity: Number(editForm.quantity) };
      if (body.salesStart) body.salesStart = new Date(body.salesStart).toISOString();
      else delete body.salesStart;
      if (body.salesEnd) body.salesEnd = new Date(body.salesEnd).toISOString();
      else delete body.salesEnd;
      await api.updateTicketType(editingId, body);
      setEditingId(null);
      await load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  async function confirmDelete() {
    setError('');
    try {
      await api.deleteTicketType(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (err) { setError(err.message); setDeleteTarget(null); }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="dash-content">
      <a href={`/dashboard/events/${eventId}`} className="back-link">← Volver al evento</a>
      <h1 className="dash-title">Tipos de Entrada</h1>
      <p className="dash-subtitle">{event?.title}</p>

      {error && <div className="error-msg">{error}</div>}

      <div className="events-header">
        <h2>{tickets.length} tipo{tickets.length !== 1 ? 's' : ''}</h2>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Agregar Tipo'}
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ej: General, VIP" required />
              </div>
              <div className="form-group">
                <label>Precio (S/)</label>
                <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => update('price', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cantidad</label>
                <input type="number" className="form-input" value={form.quantity} onChange={e => update('quantity', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input className="form-input" value={form.description} onChange={e => update('description', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Inicio de venta</label>
                <input type="datetime-local" className="form-input" value={form.salesStartDate} onChange={e => update('salesStartDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fin de venta</label>
                <input type="datetime-local" className="form-input" value={form.salesEndDate} onChange={e => update('salesEndDate', e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</button>
          </form>
        </div>
      )}

      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--white-60)' }}>No hay tipos de entrada aún.</div>
      ) : (
        tickets.map(t => (
          <div key={t.id} className="ticket-type-card">
            {editingId === t.id ? (
              <div style={{ width: '100%' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Precio (S/)</label>
                    <input type="number" step="0.01" className="form-input" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input type="number" className="form-input" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <input className="form-input" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Inicio de venta</label>
                    <input type="datetime-local" className="form-input" value={editForm.salesStart} onChange={e => setEditForm(f => ({ ...f, salesStart: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Fin de venta</label>
                    <input type="datetime-local" className="form-input" value={editForm.salesEnd} onChange={e => setEditForm(f => ({ ...f, salesEnd: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : '✓ Guardar'}</button>
                  <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="ticket-type-info">
                  <h4>{t.name}</h4>
                  <div className="ticket-type-meta">{t.description || 'Sin descripción'}</div>
                  <div className="ticket-sold">{t.sold || 0} / {t.quantity} vendidas</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="ticket-price">S/ {Number(t.price).toFixed(2)}</div>
                  <button className="btn-ghost btn-sm" onClick={() => startEdit(t)} title="Editar">✏️</button>
                  <button className="btn-ghost btn-sm" onClick={() => setDeleteTarget(t.id)} title="Eliminar" style={{ borderColor: (t.sold || 0) > 0 ? 'var(--white-10)' : 'var(--coral)', color: (t.sold || 0) > 0 ? 'var(--white-40)' : 'var(--coral)' }} disabled={(t.sold || 0) > 0}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))
      )}

      <div style={{ marginTop: 32 }}>
        <a href={`/dashboard/events/${eventId}/stats`} className="btn-ghost">📊 Ver estadísticas</a>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="¿Eliminar este tipo de entrada?"
        message="Esta acción no se puede deshacer. Solo se pueden eliminar tipos sin ventas."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { api, getToken } from '../lib/api';
import ConfirmModal from './ConfirmModal';

/* ─── Inline Editable Field ─── */
function InlineField({ label, value, onSave, type = 'text', options, multiline }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  function save() {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  }

  if (editing) {
    const inputProps = {
      ref,
      className: 'form-input',
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: save,
      onKeyDown: e => { if (e.key === 'Enter' && !multiline) save(); if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); } },
    };

    return (
      <div className="ed-field ed-field--editing">
        <span className="ed-field-label">{label}</span>
        {options ? (
          <select {...inputProps} onChange={e => { setDraft(e.target.value); }}>
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === 'datetime-local' ? (
          <input type="datetime-local" {...inputProps} />
        ) : multiline ? (
          <textarea {...inputProps} rows={3} />
        ) : (
          <input type={type} {...inputProps} />
        )}
      </div>
    );
  }

  return (
    <div className="ed-field" onClick={() => setEditing(true)} title="Clic para editar">
      <span className="ed-field-label">{label}</span>
      <span className="ed-field-value">{value || <span className="ed-field-empty">Sin definir</span>} <span className="ed-field-edit-icon">✏️</span></span>
    </div>
  );
}

/* ─── Ticket Row ─── */
function TicketRow({ ticket, onEdit, onDelete }) {
  const isBox = ticket.isBox;
  const hasSales = (ticket.sold || 0) > 0;

  return (
    <div className={`ed-ticket-row${isBox ? ' ed-ticket-row--box' : ''}`}>
      <div className="ed-ticket-info">
        <h4>
          {ticket.name}
          {isBox && <span className="eb-qty-badge">📦 Box x{ticket.boxQuantity}</span>}
        </h4>
        <div className="ticket-type-meta">
          {ticket.description || 'Sin descripción'}
          {isBox && ` · Incluye ${ticket.boxQuantity} entradas por box`}
        </div>
        <div className="ticket-sold">{ticket.sold || 0} / {ticket.quantity} vendidas</div>
      </div>
      <div className="ed-ticket-actions">
        <div className="ticket-price">S/ {Number(ticket.price).toFixed(2)}</div>
        <button className="btn-ghost btn-sm" onClick={() => onEdit(ticket)} title="Editar">✏️</button>
        <button
          className="btn-ghost btn-sm"
          onClick={() => onDelete(ticket.id)}
          title={hasSales ? 'No se puede eliminar (tiene ventas)' : 'Eliminar'}
          style={{ borderColor: hasSales ? 'var(--white-10)' : 'var(--coral)', color: hasSales ? 'var(--white-40)' : 'var(--coral)' }}
          disabled={hasSales}
        >🗑️</button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function EventDashboard({ eventId }) {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', price: '', quantity: '', description: '', ticketType: 'normal', boxQuantity: 2, maxBoxes: '' });
  const [editingTicket, setEditingTicket] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteEvent, setShowDeleteEvent] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    load();
  }, []);

  async function load() {
    try {
      const [evtData, tix, statsData] = await Promise.all([
        api.getEvent(eventId),
        api.getTicketTypes(eventId),
        api.getEventStats(eventId).catch(() => null),
      ]);
      const evt = evtData.event || evtData;
      setEvent(evt);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
      if (statsData) setStats(statsData.stats || statsData);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function updateField(key, value) {
    setError(''); setSuccess('');
    try {
      let body = { [key]: value };
      if (key === 'startDate' || key === 'endDate') body[key] = value ? new Date(value).toISOString() : null;
      if (key === 'maxCapacity') body[key] = value ? Number(value) : null;
      await api.updateEvent(eventId, body);
      setEvent(prev => ({ ...prev, [key]: value }));
      setSuccess('✅ Actualizado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) { setError(err.message); }
  }

  async function handleImageUpload(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar 5MB'); return; }
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getToken();
      const res = await fetch('https://lajarana-api.luminari.agency/api/upload', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
      await updateField('coverImage', data.url);
    } catch (err) { setError(err.message); }
    setUploading(false);
  }

  function resetTicketForm() {
    setTicketForm({ name: '', price: '', quantity: '', description: '', ticketType: 'normal', boxQuantity: 2, maxBoxes: '' });
    setEditingTicket(null);
    setShowTicketForm(false);
  }

  function startEditTicket(t) {
    setEditingTicket(t.id);
    setTicketForm({
      name: t.name,
      price: Number(t.price),
      quantity: t.quantity,
      description: t.description || '',
      ticketType: t.isBox ? 'box' : 'normal',
      boxQuantity: t.boxQuantity || 2,
      maxBoxes: t.maxBoxes || '',
    });
    setShowTicketForm(true);
  }

  async function saveTicket(e) {
    e.preventDefault();
    setError(''); setSaving(true);
    const isBox = ticketForm.ticketType === 'box';
    try {
      const body = {
        name: ticketForm.name,
        price: Number(ticketForm.price),
        quantity: Number(ticketForm.quantity),
        description: ticketForm.description || undefined,
        isBox,
        boxQuantity: isBox ? Number(ticketForm.boxQuantity) || 2 : undefined,
      };
      if (editingTicket) {
        await api.updateTicketType(editingTicket, body);
        setSuccess('✅ Entrada actualizada');
      } else {
        body.eventId = eventId;
        await api.createTicketType(body);
        setSuccess('✅ Entrada creada');
      }
      resetTicketForm();
      const tix = await api.getTicketTypes(eventId);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
    } catch (err) { setError(err.message); }
    setSaving(false);
    setTimeout(() => setSuccess(''), 2000);
  }

  async function deleteTicket() {
    setError('');
    try {
      await api.deleteTicketType(deleteTarget);
      setDeleteTarget(null);
      const tix = await api.getTicketTypes(eventId);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
      setSuccess('✅ Entrada eliminada');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) { setError(err.message); setDeleteTarget(null); }
  }

  async function toggleStatus() {
    setError('');
    const newStatus = event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.updateEvent(eventId, { status: newStatus });
      setEvent(prev => ({ ...prev, status: newStatus }));
      setSuccess(newStatus === 'PUBLISHED' ? '🎉 ¡Evento publicado!' : '📝 Evento en borrador');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) { setError(err.message); }
  }

  if (loading) return <div className="loading">Cargando evento...</div>;
  if (!event) return <div className="dash-content"><div className="error-msg">Evento no encontrado</div></div>;

  const categories = ["Concierto", "Festival", "Fiesta", "Teatro", "Deportes", "Conferencia", "Otro"];
  const normalTickets = tickets.filter(t => !t.isBox);
  const boxTickets = tickets.filter(t => t.isBox);

  return (
    <div className="dash-content ed-dashboard">
      <a href="/dashboard" className="back-link">← Volver al dashboard</a>

      {/* Header */}
      <div className="ed-header">
        <div className="ed-header-info">
          <h1 className="dash-title gradient-text">{event.title}</h1>
          <div className="ed-header-meta">
            <span className={`badge badge-${(event.status || 'draft').toLowerCase()}`}>{event.status || 'DRAFT'}</span>
            {event.city && <span className="event-meta-tag">📍 {event.city}</span>}
            {event.category && <span className="event-meta-tag">🏷️ {event.category}</span>}
          </div>
        </div>
        <div className="ed-header-actions">
          <button className="btn-primary btn-sm" onClick={toggleStatus}>
            {event.status === 'PUBLISHED' ? '📝 Pasar a borrador' : '🚀 Publicar'}
          </button>
          {event.status === 'PUBLISHED' && event.slug && (
            <a href={`/events/${event.slug}`} className="btn-ghost btn-sm" target="_blank">👁️ Ver público</a>
          )}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎟️</div>
            <div>
              <div className="stat-value gradient-text">{stats.totalTicketsSold ?? 0}</div>
              <div className="stat-label">Entradas vendidas</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--lime)' }}>S/ {Number(stats.totalRevenue ?? 0).toFixed(2)}</div>
              <div className="stat-label">Ingresos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--coral)' }}>{stats.totalOrders ?? 0}</div>
              <div className="stat-label">Órdenes</div>
            </div>
          </div>
        </div>
      )}

      {/* Event Info Section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2>📝 Información del Evento</h2>
        </div>
        <div className="ed-section-body">
          {/* Cover Image */}
          <div className="ed-cover-area">
            {event.coverImage ? (
              <div className="ed-cover-preview">
                <img src={event.coverImage} alt="Portada" />
                <div className="ed-cover-overlay">
                  <label className="btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    📷 Cambiar imagen
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="ed-cover-empty" style={{ cursor: 'pointer' }}>
                {uploading ? '⏳ Subiendo...' : '📷 Agregar imagen de portada'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files?.[0])} />
              </label>
            )}
          </div>

          <div className="ed-fields-grid">
            <InlineField label="Título" value={event.title} onSave={v => updateField('title', v)} />
            <InlineField label="Categoría" value={event.category} onSave={v => updateField('category', v)} options={categories} />
            <InlineField label="Venue / Local" value={event.venue} onSave={v => updateField('venue', v)} />
            <InlineField label="Ciudad" value={event.city} onSave={v => updateField('city', v)} />
            <InlineField label="Dirección" value={event.address} onSave={v => updateField('address', v)} />
            <InlineField label="Capacidad máxima" value={event.maxCapacity} onSave={v => updateField('maxCapacity', v)} type="number" />
            <InlineField label="Fecha inicio" value={event.startDate ? event.startDate.slice(0, 16) : ''} onSave={v => updateField('startDate', v)} type="datetime-local" />
            <InlineField label="Fecha fin" value={event.endDate ? event.endDate.slice(0, 16) : ''} onSave={v => updateField('endDate', v)} type="datetime-local" />
          </div>
          <div style={{ marginTop: 16 }}>
            <InlineField label="Descripción" value={event.description} onSave={v => updateField('description', v)} multiline />
          </div>
        </div>
      </div>

      {/* Ticket Types Section */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2>🎟️ Tipos de Entrada</h2>
          <button className="btn-primary btn-sm" onClick={() => { resetTicketForm(); setShowTicketForm(!showTicketForm); }}>
            {showTicketForm && !editingTicket ? '✕ Cancelar' : '+ Agregar entrada'}
          </button>
        </div>

        {showTicketForm && (
          <div className="ed-ticket-form">
            <form onSubmit={saveTicket}>
              <h3 style={{ marginBottom: 16, fontSize: '1.05rem' }}>{editingTicket ? '✏️ Editar entrada' : '➕ Nueva entrada'}</h3>

              {/* Type Selector */}
              <div className="ed-type-selector">
                <button
                  type="button"
                  className={`ed-type-btn${ticketForm.ticketType === 'normal' ? ' ed-type-btn--active' : ''}`}
                  onClick={() => setTicketForm(f => ({ ...f, ticketType: 'normal' }))}
                >
                  🎟️ Entrada Normal
                </button>
                <button
                  type="button"
                  className={`ed-type-btn${ticketForm.ticketType === 'box' ? ' ed-type-btn--active' : ''}`}
                  onClick={() => setTicketForm(f => ({ ...f, ticketType: 'box' }))}
                >
                  📦 Box
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="form-input" value={ticketForm.name} onChange={e => setTicketForm(f => ({ ...f, name: e.target.value }))} placeholder={ticketForm.ticketType === 'box' ? 'Ej: Box VIP x6' : 'Ej: General, VIP'} required />
                </div>
                <div className="form-group">
                  <label>Precio (S/) *</label>
                  <input type="number" step="0.01" min="0" className="form-input" value={ticketForm.price} onChange={e => setTicketForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{ticketForm.ticketType === 'box' ? 'Cantidad de boxes disponibles *' : 'Cantidad disponible *'}</label>
                  <input type="number" min="1" className="form-input" value={ticketForm.quantity} onChange={e => setTicketForm(f => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input className="form-input" value={ticketForm.description} onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))} placeholder={ticketForm.ticketType === 'box' ? 'Ej: Incluye mesa y bebidas' : 'Acceso general, incluye...'} />
                </div>
              </div>

              {ticketForm.ticketType === 'box' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>📦 Entradas por box *</label>
                    <input type="number" min="2" className="form-input" value={ticketForm.boxQuantity} onChange={e => setTicketForm(f => ({ ...f, boxQuantity: e.target.value }))} />
                    <span className="form-hint">Cantidad de personas que entran con cada box</span>
                  </div>
                  <div className="form-group" />
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Guardando...' : editingTicket ? '✓ Guardar cambios' : '✓ Agregar entrada'}
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={resetTicketForm}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="ed-section-body">
          {/* Normal tickets */}
          {normalTickets.length > 0 && (
            <div className="ed-ticket-group">
              {normalTickets.map(t => (
                <TicketRow key={t.id} ticket={t} onEdit={startEditTicket} onDelete={id => setDeleteTarget(id)} />
              ))}
            </div>
          )}

          {/* Box tickets */}
          {boxTickets.length > 0 && (
            <div className="ed-ticket-group">
              <div className="ed-ticket-group-label">📦 Boxes</div>
              {boxTickets.map(t => (
                <TicketRow key={t.id} ticket={t} onEdit={startEditTicket} onDelete={id => setDeleteTarget(id)} />
              ))}
            </div>
          )}

          {tickets.length === 0 && !showTicketForm && (
            <div className="wizard-empty">
              <span style={{ fontSize: '2.5rem' }}>🎫</span>
              <p>Aún no hay tipos de entrada</p>
              <p className="wizard-empty-sub">Agrega entradas normales o boxes para tu evento</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="ed-section">
        <div className="ed-section-header">
          <h2>⚡ Acciones rápidas</h2>
        </div>
        <div className="ed-quick-links">
          <a href={`/dashboard/events/${eventId}/stats`} className="btn-ghost">📊 Estadísticas detalladas</a>
          <a href={`/dashboard/events/${eventId}/tickets`} className="btn-ghost">🎟️ Gestión avanzada de entradas</a>
          <a href="/dashboard/scanner" className="btn-ghost">📱 Escáner QR</a>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="ed-section ed-section--danger">
        <div className="ed-section-header">
          <h2>⚠️ Zona de peligro</h2>
        </div>
        <div className="ed-section-body">
          <button className="btn-danger-outline" onClick={() => setShowDeleteEvent(true)}>
            🗑️ Eliminar evento
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="¿Eliminar este tipo de entrada?"
        message="Esta acción no se puede deshacer."
        onConfirm={deleteTicket}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        isOpen={showDeleteEvent}
        title="¿Eliminar este evento?"
        message="Esta acción no se puede deshacer. El evento y todas sus entradas serán eliminados."
        onConfirm={() => {
          api.deleteEvent(eventId).then(() => { window.location.href = '/dashboard'; }).catch(err => alert(err.message));
        }}
        onCancel={() => setShowDeleteEvent(false)}
      />
    </div>
  );
}

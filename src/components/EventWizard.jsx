import { useState, useEffect } from 'react';
import { api, getToken } from '../lib/api';

const STEPS = [
  { num: 1, label: 'Información', icon: '📝' },
  { num: 2, label: 'Entradas', icon: '🎟️' },
  { num: 3, label: 'Revisar y Publicar', icon: '🚀' },
];

function getToday() {
  return new Date().toISOString().slice(0, 16);
}

function Stepper({ current }) {
  return (
    <div className="wizard-stepper">
      {STEPS.map((s, i) => (
        <div key={s.num} className={`wizard-step ${current >= s.num ? 'wizard-step--active' : ''} ${current === s.num ? 'wizard-step--current' : ''}`}>
          <div className="wizard-step-circle">
            {current > s.num ? '✓' : s.icon}
          </div>
          <span className="wizard-step-label">{s.label}</span>
          {i < STEPS.length - 1 && <div className="wizard-step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function EventWizard({ eventId: editId }) {
  const isEdit = !!editId;
  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState(editId || null);
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', venue: '', address: '', city: '',
    startDate: '', endDate: '', coverImage: '', maxCapacity: '',
  });
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({ name: '', price: '', quantity: '', description: '' });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    if (isEdit) loadEvent(editId);
  }, []);

  async function loadEvent(id) {
    try {
      const data = await api.getEvent(id);
      const evt = data.event || data;
      setEvent(evt);
      setForm({
        title: evt.title || '',
        description: evt.description || '',
        venue: evt.venue || '',
        address: evt.address || '',
        city: evt.city || '',
        startDate: evt.startDate ? evt.startDate.slice(0, 16) : '',
        endDate: evt.endDate ? evt.endDate.slice(0, 16) : '',
        coverImage: evt.coverImage || '',
        maxCapacity: evt.maxCapacity || '',
      });
      const tix = await api.getTicketTypes(id);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
    } catch (err) { setError(err.message); }
    setFetching(false);
  }

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function updateTicket(key, val) { setTicketForm(f => ({ ...f, [key]: val })); }

  function validateDates() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (form.startDate && new Date(form.startDate) < now) {
      setError('La fecha de inicio no puede ser en el pasado.');
      return false;
    }
    if (form.endDate && new Date(form.endDate) < now) {
      setError('La fecha de fin no puede ser en el pasado.');
      return false;
    }
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return false;
    }
    return true;
  }

  async function saveStep1(asDraft = true) {
    setError(''); setSuccess('');
    if (!form.title.trim()) { setError('El título es obligatorio.'); return; }
    if (!validateDates()) return;
    setLoading(true);
    try {
      const body = { ...form, status: 'DRAFT' };
      if (body.maxCapacity) body.maxCapacity = Number(body.maxCapacity);
      else delete body.maxCapacity;
      if (body.startDate) body.startDate = new Date(body.startDate).toISOString();
      if (body.endDate) body.endDate = new Date(body.endDate).toISOString();
      Object.keys(body).forEach(k => { if (body[k] === '') delete body[k]; });

      let result;
      if (eventId) {
        result = await api.updateEvent(eventId, body);
      } else {
        result = await api.createEvent(body);
      }
      const id = result.id || result.event?.id || eventId;
      setEventId(id);
      setSuccess(asDraft ? '✅ Evento guardado como borrador' : '✅ Información guardada');
      if (!asDraft) {
        setTimeout(() => { setSuccess(''); setStep(2); }, 600);
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function addTicket(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!ticketForm.name || !ticketForm.price || !ticketForm.quantity) {
      setError('Nombre, precio y cantidad son obligatorios.'); return;
    }
    setLoading(true);
    try {
      const body = {
        eventId,
        name: ticketForm.name,
        price: Number(ticketForm.price),
        quantity: Number(ticketForm.quantity),
        description: ticketForm.description || undefined,
      };
      await api.createTicketType(body);
      setTicketForm({ name: '', price: '', quantity: '', description: '' });
      setShowTicketForm(false);
      // reload tickets
      const tix = await api.getTicketTypes(eventId);
      setTickets(Array.isArray(tix) ? tix : tix.ticketTypes || tix.data || []);
      setSuccess('✅ Tipo de entrada agregado');
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  async function publishEvent() {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.updateEvent(eventId, { status: 'PUBLISHED' });
      setSuccess('🎉 ¡Evento publicado exitosamente!');
      setTimeout(() => { window.location.href = `/dashboard/events/${eventId}`; }, 1500);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  if (fetching) return <div className="loading">Cargando evento...</div>;

  const minDate = getToday();

  return (
    <div className="dash-content wizard-content">
      <a href="/dashboard" className="back-link">← Volver al dashboard</a>
      <h1 className="dash-title gradient-text">{isEdit ? 'Editar Evento' : 'Crear Evento'}</h1>
      <p className="dash-subtitle">Completa los pasos para crear tu evento</p>

      <Stepper current={step} />

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* STEP 1: Event Info */}
      {step === 1 && (
        <div className="wizard-card">
          <div className="wizard-card-header">
            <h2>📝 Información del Evento</h2>
            <p className="wizard-card-desc">Datos básicos de tu evento</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); saveStep1(false); }}>
            <div className="form-group">
              <label>Título del evento *</label>
              <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} required placeholder="Ej: Noche de Cumbia en Lima" />
              <span className="form-hint">El nombre que verán los asistentes</span>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea className="form-input" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe tu evento, artistas, actividades..." rows={4} />
              <span className="form-hint">Cuenta de qué trata tu evento para atraer asistentes</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>🏛️ Venue / Local</label>
                <input className="form-input" value={form.venue} onChange={e => update('venue', e.target.value)} placeholder="Ej: Arena Perú" />
              </div>
              <div className="form-group">
                <label>🌆 Ciudad</label>
                <input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Ej: Lima" />
              </div>
            </div>
            <div className="form-group">
              <label>📍 Dirección</label>
              <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Ej: Av. La Marina 1234, San Miguel" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>📅 Fecha y hora de inicio</label>
                <input type="datetime-local" className="form-input" value={form.startDate} onChange={e => update('startDate', e.target.value)} min={minDate} />
                <span className="form-hint">No puede ser en el pasado</span>
              </div>
              <div className="form-group">
                <label>📅 Fecha y hora de fin</label>
                <input type="datetime-local" className="form-input" value={form.endDate} onChange={e => update('endDate', e.target.value)} min={form.startDate || minDate} />
                <span className="form-hint">Debe ser igual o posterior al inicio</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>🖼️ URL de imagen de portada</label>
                <input className="form-input" value={form.coverImage} onChange={e => update('coverImage', e.target.value)} placeholder="https://..." />
                <span className="form-hint">Imagen que se mostrará en la página del evento</span>
              </div>
              <div className="form-group">
                <label>👥 Capacidad máxima</label>
                <input type="number" className="form-input" value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)} placeholder="Ej: 500" min="1" />
                <span className="form-hint">Máximo de asistentes permitidos</span>
              </div>
            </div>
            {form.coverImage && (
              <div className="cover-preview">
                <img src={form.coverImage} alt="Preview" onError={e => e.target.style.display='none'} />
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-sm" disabled={loading}>
                {loading ? 'Guardando...' : 'Siguiente →'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => saveStep1(true)} disabled={loading}>
                💾 Guardar como borrador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Ticket Types */}
      {step === 2 && (
        <div className="wizard-card">
          <div className="wizard-card-header">
            <h2>🎟️ Tipos de Entrada</h2>
            <p className="wizard-card-desc">Agrega las entradas que estarán disponibles para tu evento</p>
          </div>

          <div className="wizard-tickets-list">
            {tickets.length === 0 ? (
              <div className="wizard-empty">
                <span style={{ fontSize: '2.5rem' }}>🎫</span>
                <p>Aún no hay tipos de entrada</p>
                <p className="wizard-empty-sub">Agrega al menos un tipo de entrada para tu evento</p>
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="ticket-type-card ticket-type-card--enhanced">
                  <div className="ticket-type-info">
                    <h4>{t.name}</h4>
                    <div className="ticket-type-meta">{t.description || 'Sin descripción'}</div>
                    <div className="ticket-sold">
                      <span className="ticket-qty-badge">{t.quantity} disponibles</span>
                    </div>
                  </div>
                  <div className="ticket-price">S/ {Number(t.price).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>

          <button className="btn-secondary wizard-add-btn" onClick={() => setShowTicketForm(!showTicketForm)}>
            {showTicketForm ? '✕ Cancelar' : '+ Agregar tipo de entrada'}
          </button>

          {showTicketForm && (
            <div className="wizard-ticket-form">
              <form onSubmit={addTicket}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input className="form-input" value={ticketForm.name} onChange={e => updateTicket('name', e.target.value)} placeholder="Ej: General, VIP, Platinum" required />
                  </div>
                  <div className="form-group">
                    <label>Precio (S/) *</label>
                    <input type="number" step="0.01" min="0" className="form-input" value={ticketForm.price} onChange={e => updateTicket('price', e.target.value)} placeholder="0.00" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input type="number" min="1" className="form-input" value={ticketForm.quantity} onChange={e => updateTicket('quantity', e.target.value)} placeholder="100" required />
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <input className="form-input" value={ticketForm.description} onChange={e => updateTicket('description', e.target.value)} placeholder="Acceso general, incluye..." />
                  </div>
                </div>
                <button type="submit" className="btn-primary btn-sm" disabled={loading}>
                  {loading ? 'Guardando...' : '✓ Agregar entrada'}
                </button>
              </form>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 32 }}>
            <button className="btn-primary btn-sm" onClick={() => { setError(''); setSuccess(''); setStep(3); }}>
              Siguiente →
            </button>
            <button className="btn-ghost" onClick={() => { setError(''); setSuccess(''); setStep(1); }}>
              ← Atrás
            </button>
            <button className="btn-ghost" onClick={() => { window.location.href = '/dashboard'; }}>
              💾 Guardar como borrador
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Publish */}
      {step === 3 && (
        <div className="wizard-card">
          <div className="wizard-card-header">
            <h2>🚀 Revisar y Publicar</h2>
            <p className="wizard-card-desc">Revisa toda la información antes de publicar</p>
          </div>

          <div className="review-section">
            <h3 className="review-section-title">📝 Información del Evento</h3>
            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Título</span>
                <span className="review-value">{form.title || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Ciudad</span>
                <span className="review-value">{form.city || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Venue</span>
                <span className="review-value">{form.venue || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Dirección</span>
                <span className="review-value">{form.address || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Fecha inicio</span>
                <span className="review-value">{form.startDate ? new Date(form.startDate).toLocaleString('es-PE') : '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Fecha fin</span>
                <span className="review-value">{form.endDate ? new Date(form.endDate).toLocaleString('es-PE') : '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Capacidad</span>
                <span className="review-value">{form.maxCapacity || 'Sin límite'}</span>
              </div>
            </div>
            {form.description && (
              <div className="review-description">
                <span className="review-label">Descripción</span>
                <p>{form.description}</p>
              </div>
            )}
          </div>

          <div className="review-section">
            <h3 className="review-section-title">🎟️ Tipos de Entrada ({tickets.length})</h3>
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--coral)', padding: '12px 0' }}>⚠️ No has agregado tipos de entrada. Puedes publicar sin entradas y agregarlas después.</p>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="review-ticket">
                  <div>
                    <strong>{t.name}</strong>
                    <span className="review-ticket-qty">{t.quantity} disponibles</span>
                  </div>
                  <span className="review-ticket-price">S/ {Number(t.price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {form.coverImage && (
            <div className="review-section">
              <h3 className="review-section-title">🖼️ Portada</h3>
              <div className="cover-preview">
                <img src={form.coverImage} alt="Portada" onError={e => e.target.style.display='none'} />
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 32 }}>
            <button className="btn-primary btn-sm" onClick={publishEvent} disabled={loading}>
              {loading ? 'Publicando...' : '🚀 Publicar Evento'}
            </button>
            <button className="btn-ghost" onClick={() => { setError(''); setSuccess(''); setStep(2); }}>
              ← Atrás
            </button>
            <button className="btn-ghost" onClick={() => { window.location.href = '/dashboard'; }}>
              💾 Guardar como borrador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

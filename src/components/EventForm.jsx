import { useState, useEffect } from 'react';
import { api, getToken } from '../lib/api';

export default function EventForm({ eventId }) {
  const isEdit = !!eventId;
  const [form, setForm] = useState({
    title: '', description: '', venue: '', address: '', city: '',
    startDate: '', endDate: '', coverImage: '', maxCapacity: '',
    status: 'DRAFT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    if (isEdit) {
      api.getEvent(eventId).then(data => {
        const evt = data.event || data;
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
          status: evt.status || 'DRAFT'
        });
        setFetching(false);
      }).catch(err => { setError(err.message); setFetching(false); });
    }
  }, []);

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form };
      if (body.maxCapacity) body.maxCapacity = Number(body.maxCapacity);
      else delete body.maxCapacity;
      if (body.startDate) body.startDate = new Date(body.startDate).toISOString();
      if (body.endDate) body.endDate = new Date(body.endDate).toISOString();
      Object.keys(body).forEach(k => { if (body[k] === '') delete body[k]; });

      let result;
      if (isEdit) {
        result = await api.updateEvent(eventId, body);
      } else {
        result = await api.createEvent(body);
      }
      const id = result.id || result.event?.id || eventId;
      window.location.href = `/dashboard/events/${id}/tickets`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="loading">Cargando evento...</div>;

  return (
    <div className="dash-content">
      <a href="/dashboard" className="back-link">← Volver al dashboard</a>
      <h1 className="dash-title">{isEdit ? 'Editar Evento' : 'Crear Evento'}</h1>
      <div className="form-card" style={{ maxWidth: 700 }}>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título del evento</label>
            <input className="form-input" value={form.title} onChange={e => update('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea className="form-input" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Venue / Local</label>
              <input className="form-input" value={form.venue} onChange={e => update('venue', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha inicio</label>
              <input type="datetime-local" className="form-input" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha fin</label>
              <input type="datetime-local" className="form-input" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>URL de portada</label>
              <input className="form-input" value={form.coverImage} onChange={e => update('coverImage', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Capacidad máxima</label>
              <input type="number" className="form-input" value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select className="form-input" value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-sm" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Evento'}
            </button>
            <a href="/dashboard" className="btn-ghost">Cancelar</a>
          </div>
        </form>
      </div>
    </div>
  );
}

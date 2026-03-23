import { useState, useEffect } from 'react';
import { api, getToken, clearToken } from '../lib/api';
import ConfirmModal from './ConfirmModal';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    Promise.all([api.me(), api.getMyEvents()])
      .then(([u, evts]) => {
        setUser(u.user || u);
        const evtList = Array.isArray(evts) ? evts : evts.events || evts.data || [];
        setEvents(evtList);
        setLoading(false);
      })
      .catch(() => { clearToken(); window.location.href = '/login'; });
  }, []);

  function logout() { clearToken(); window.location.href = '/login'; }

  if (loading) return <div className="dash-layout"><div className="loading">Cargando...</div></div>;

  const totalEvents = events.length;
  const published = events.filter(e => e.status === 'PUBLISHED').length;
  const drafts = totalEvents - published;

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <a href="/dashboard" className="logo"><img src="/logo.png" alt="LaJarana" style={{height:'48px',marginRight:'8px',verticalAlign:'middle'}} /> LaJarana</a>
        <div className="dash-header-right">
          <a href="/dashboard/scanner" className="btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>📷 Scanner</a>
          <a href="/dashboard/plan" className="btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
            {user?.plan === 'PRO' ? '⭐ Pro' : '🎫 Plan'}
          </a>
          <a href="/dashboard/profile" className="btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>Perfil</a>
          <span className="dash-user-name">{user?.name || user?.email}</span>
          <button className="dash-logout" onClick={logout}>Salir</button>
        </div>
      </header>
      <div className="dash-content">
        <h1 className="dash-title gradient-text">Dashboard</h1>
        <p className="dash-subtitle">Gestiona tus eventos y entradas</p>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <div className="stat-value gradient-text">{totalEvents}</div>
            <div className="stat-label">Eventos totales</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-value" style={{ color: 'var(--lime)' }}>{published}</div>
            <div className="stat-label">Publicados</div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📝</span>
            <div className="stat-value" style={{ color: 'var(--coral)' }}>{drafts}</div>
            <div className="stat-label">Borradores</div>
          </div>
        </div>

        <div className="events-header">
          <h2>Mis Eventos</h2>
          <a href="/dashboard/events/new" className="btn-primary btn-sm">+ Crear Evento</a>
        </div>

        {events.length === 0 ? (
          <div className="dash-empty-state">
            <div className="dash-empty-illustration">
              <span className="dash-empty-icon">🎫</span>
              <span className="dash-empty-icon dash-empty-icon--secondary">✨</span>
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Aún no tienes eventos</h3>
            <p style={{ fontSize: '0.95rem', marginBottom: 24, color: 'var(--white-60)', maxWidth: 400, margin: '0 auto 24px' }}>
              Crea tu primer evento en minutos y empieza a vender entradas con QR anti-fraude.
            </p>
            <a href="/dashboard/events/new" className="btn-primary" style={{ display: 'inline-flex' }}>🚀 Crear mi primer evento</a>
          </div>
        ) : (
          events.map(evt => (
            <div key={evt.id} className="event-row-wrapper">
              <a href={`/dashboard/events/${evt.id}`} className="event-row">
                <div className="event-row-info">
                  <h3>{evt.title}</h3>
                  <div className="event-row-meta">
                    {evt.startDate && (
                      <span className="event-meta-tag">📅 {new Date(evt.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                    {evt.venue && <span className="event-meta-tag">🏛️ {evt.venue}</span>}
                    {evt.city && <span className="event-meta-tag">📍 {evt.city}</span>}
                    {evt.maxCapacity && <span className="event-meta-tag">👥 {evt.maxCapacity}</span>}
                  </div>
                </div>
                <span className={`badge badge-${(evt.status || 'draft').toLowerCase()}`}>
                  {evt.status === 'PUBLISHED' ? '✅ Publicado' : evt.status === 'DRAFT' ? '📝 Borrador' : evt.status || 'DRAFT'}
                </span>
              </a>
              <button
                className="btn-delete-event"
                title="Eliminar evento"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(evt.id);
                }}
              >🗑️</button>
            </div>
          ))
        )}
      </div>
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onConfirm={() => {
          const id = deleteTarget;
          setDeleting(true);
          setDeleteTarget(null);
          api.deleteEvent(id).then(() => {
            setEvents(prev => prev.filter(ev => ev.id !== id));
          }).catch(err => alert('Error al eliminar: ' + err.message))
          .finally(() => setDeleting(false));
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

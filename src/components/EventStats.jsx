import { useState, useEffect } from 'react';
import { api, getToken } from '../lib/api';

export default function EventStats({ eventId }) {
  const [stats, setStats] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    Promise.all([api.getEvent(eventId), api.getEventStats(eventId)])
      .then(([evtData, statsData]) => {
        setEvent(evtData.event || evtData);
        setStats(statsData.stats || statsData);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Cargando estadísticas...</div>;
  if (error) return <div className="dash-content"><div className="error-msg">{error}</div></div>;

  return (
    <div className="dash-content">
      <a href={`/dashboard/events/${eventId}/tickets`} className="back-link">← Volver a entradas</a>
      <h1 className="dash-title">Estadísticas</h1>
      <p className="dash-subtitle">{event?.title}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value gradient-text">{stats?.ticketsSold ?? 0}</div>
          <div className="stat-label">Entradas vendidas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--lime)' }}>S/ {Number(stats?.revenue ?? 0).toFixed(2)}</div>
          <div className="stat-label">Ingresos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--coral)' }}>{stats?.ordersCount ?? 0}</div>
          <div className="stat-label">Órdenes</div>
        </div>
      </div>

      {stats?.ticketTypes && stats.ticketTypes.length > 0 && (
        <>
          <h2 style={{ marginBottom: 16 }}>Por tipo de entrada</h2>
          {stats.ticketTypes.map((t, i) => (
            <div key={i} className="ticket-type-card">
              <div className="ticket-type-info">
                <h4>{t.name}</h4>
                <div className="ticket-sold">{t.sold || 0} / {t.quantity} vendidas</div>
              </div>
              <div className="ticket-price">S/ {Number(t.revenue ?? 0).toFixed(2)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

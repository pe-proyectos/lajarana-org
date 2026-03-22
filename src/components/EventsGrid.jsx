import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPriceRange(ticketTypes) {
  if (!ticketTypes || ticketTypes.length === 0) return null;
  const prices = ticketTypes.map(t => Number(t.price)).filter(p => p > 0);
  if (prices.length === 0) return 'Gratis';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `S/ ${min.toFixed(2)}`;
  return `Desde S/ ${min.toFixed(2)}`;
}

export default function EventsGrid() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPublicEvents()
      .then(data => {
        const list = Array.isArray(data) ? data : data.events || data.data || [];
        setEvents(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.title || '').toLowerCase().includes(q) ||
           (e.venue || '').toLowerCase().includes(q) ||
           (e.city || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="events-page-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="event-card-skeleton island">
            <div className="skeleton-cover" />
            <div className="skeleton-body">
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="events-search-bar">
        <input
          type="text"
          className="form-input events-search-input"
          placeholder="🔍 Buscar por nombre, lugar o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="featured-empty">
          <div className="featured-empty-icon">🔍</div>
          <h3>{events.length === 0 ? 'No hay eventos disponibles' : 'Sin resultados'}</h3>
          <p>{events.length === 0 ? 'Pronto publicaremos eventos increíbles. ¡Vuelve pronto!' : 'Intenta con otra búsqueda.'}</p>
        </div>
      ) : (
        <div className="events-page-grid">
          {filtered.map(evt => (
            <a key={evt.id} href={`/events/${evt.slug}`} className="event-card island">
              <div className="event-card-cover">
                {evt.coverImage ? (
                  <img src={evt.coverImage} alt={evt.title} loading="lazy" />
                ) : (
                  <div className="event-card-placeholder">🎉</div>
                )}
                {evt.startDate && (
                  <div className="event-card-date">
                    <span className="event-card-date-day">{new Date(evt.startDate).getDate()}</span>
                    <span className="event-card-date-month">{new Date(evt.startDate).toLocaleDateString('es-PE', { month: 'short' }).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="event-card-body">
                <h3 className="event-card-title">{evt.title}</h3>
                <div className="event-card-meta">
                  {evt.startDate && <span>📅 {formatDate(evt.startDate)}</span>}
                </div>
                <div className="event-card-meta">
                  {evt.venue && <span>📍 {evt.venue}</span>}
                  {evt.city && <span> · {evt.city}</span>}
                </div>
                <div className="event-card-price">
                  {getPriceRange(evt.ticketTypes) || 'Gratis'}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

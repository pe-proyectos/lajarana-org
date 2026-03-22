import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPriceRange(ticketTypes) {
  if (!ticketTypes || ticketTypes.length === 0) return null;
  const prices = ticketTypes.map(t => Number(t.price)).filter(p => p > 0);
  if (prices.length === 0) return 'Gratis';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `S/ ${min.toFixed(2)}`;
  return `S/ ${min.toFixed(2)} — ${max.toFixed(2)}`;
}

export default function FeaturedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicEvents()
      .then(data => {
        const list = Array.isArray(data) ? data : data.events || data.data || [];
        setEvents(list.slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="featured-events-grid">
        {[1, 2, 3].map(i => (
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

  if (events.length === 0) {
    return (
      <div className="featured-empty">
        <div className="featured-empty-icon">🎭</div>
        <h3>Próximamente</h3>
        <p>Estamos preparando los mejores eventos para ti. ¡Vuelve pronto!</p>
        <a href="/register" className="btn-secondary" style={{ marginTop: 16 }}>
          ¿Organizas eventos? Regístrate →
        </a>
      </div>
    );
  }

  return (
    <div className="featured-events-grid">
      {events.map(evt => (
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
              {evt.venue && <span>📍 {evt.venue}</span>}
              {evt.city && <span> · {evt.city}</span>}
            </div>
            {evt.ticketTypes && (
              <div className="event-card-price">
                {getPriceRange(evt.ticketTypes) || 'Gratis'}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

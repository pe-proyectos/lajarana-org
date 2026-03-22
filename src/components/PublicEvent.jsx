import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function PublicEvent({ slug }) {
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({});
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    api.getPublicEvent(slug)
      .then(data => {
        const evt = data.event || data;
        setEvent(evt);
        setTickets(evt.ticketTypes || []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  function updateQty(id, delta) {
    setQuantities(q => {
      const current = q[id] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...q, [id]: next };
    });
  }

  function totalAmount() {
    return tickets.reduce((sum, t) => sum + (quantities[t.id] || 0) * Number(t.price), 0);
  }

  function totalTickets() {
    return Object.values(quantities).reduce((a, b) => a + b, 0);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: event.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Link copiado!');
    }
  }

  if (loading) {
    return (
      <div className="dash-content" style={{ maxWidth: 960, paddingTop: 40 }}>
        <div className="skeleton-cover" style={{ height: 300, borderRadius: 'var(--radius)', marginBottom: 24 }} />
        <div className="skeleton-line" style={{ width: '60%', height: 32, marginBottom: 16 }} />
        <div className="skeleton-line" style={{ width: '40%', height: 20 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-content" style={{ maxWidth: 960, paddingTop: 40 }}>
        <div className="error-msg">{error}</div>
        <a href="/eventos" className="back-link">← Ver todos los eventos</a>
      </div>
    );
  }

  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const formattedTime = event.startDate
    ? new Date(event.startDate).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="dash-content" style={{ maxWidth: 960, paddingTop: 20 }}>
      <a href="/eventos" className="back-link">← Todos los eventos</a>

      {/* Hero cover */}
      <div className="public-event-hero">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="public-event-cover" />
        ) : (
          <div className="public-event-cover-placeholder">
            <span>🎉</span>
          </div>
        )}
      </div>

      <div className="event-details-grid">
        {/* Left: Event info */}
        <div>
          <h1 className="dash-title gradient-text" style={{ fontSize: '2.2rem', marginBottom: 16 }}>{event.title}</h1>

          {/* Quick info pills */}
          <div className="event-pills">
            {formattedDate && (
              <div className="event-pill">
                <span className="event-pill-icon">📅</span>
                <div>
                  <div className="event-pill-label">Fecha</div>
                  <div className="event-pill-value">{formattedDate}</div>
                  {formattedTime && <div className="event-pill-sub">{formattedTime}</div>}
                </div>
              </div>
            )}
            {event.venue && (
              <div className="event-pill">
                <span className="event-pill-icon">📍</span>
                <div>
                  <div className="event-pill-label">Lugar</div>
                  <div className="event-pill-value">{event.venue}</div>
                  {(event.address || event.city) && (
                    <div className="event-pill-sub">{[event.address, event.city].filter(Boolean).join(', ')}</div>
                  )}
                </div>
              </div>
            )}
            {event.maxCapacity && (
              <div className="event-pill">
                <span className="event-pill-icon">👥</span>
                <div>
                  <div className="event-pill-label">Capacidad</div>
                  <div className="event-pill-value">{event.maxCapacity} personas</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="event-description">
              <h3>Sobre el evento</h3>
              <p>{event.description}</p>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <div className="event-organizer-info">
              <h3>Organizador</h3>
              <div className="event-organizer-card">
                <div className="event-organizer-avatar">
                  {(event.organizer.name || 'O').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{event.organizer.name || event.organizer.email}</div>
                  {event.organizer.company && <div style={{ color: 'var(--white-60)', fontSize: '0.85rem' }}>{event.organizer.company}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Share */}
          <button className="btn-secondary" onClick={handleShare} style={{ marginTop: 24 }}>
            📤 Compartir evento
          </button>
        </div>

        {/* Right: Tickets sidebar */}
        <div className="tickets-sidebar">
          <div className="tickets-sidebar-card">
            <h3 style={{ marginBottom: 20 }}>🎟️ Entradas</h3>
            {tickets.length === 0 ? (
              <p style={{ color: 'var(--white-60)', textAlign: 'center', padding: '20px 0' }}>Entradas próximamente</p>
            ) : (
              <>
                {tickets.map(t => {
                  const qty = quantities[t.id] || 0;
                  const available = t.quantity - (t.sold || 0);
                  const soldOut = available <= 0;
                  return (
                    <div key={t.id} className={`ticket-select-card ${soldOut ? 'ticket-sold-out' : ''}`}>
                      <div className="ticket-select-info">
                        <div className="ticket-select-name">{t.name}</div>
                        {t.description && <div className="ticket-select-desc">{t.description}</div>}
                        <div className="ticket-select-price">S/ {Number(t.price).toFixed(2)}</div>
                      </div>
                      {soldOut ? (
                        <div className="ticket-select-soldout">Agotado</div>
                      ) : (
                        <div className="ticket-qty-control">
                          <button className="qty-btn" onClick={() => updateQty(t.id, -1)} disabled={qty === 0}>−</button>
                          <span className="qty-value">{qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(t.id, 1)} disabled={qty >= Math.min(10, available)}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {totalTickets() > 0 && (
                  <div className="ticket-total">
                    <div>
                      <span style={{ color: 'var(--white-60)' }}>{totalTickets()} entrada{totalTickets() > 1 ? 's' : ''}</span>
                    </div>
                    <div className="ticket-total-price">S/ {totalAmount().toFixed(2)}</div>
                  </div>
                )}

                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                  disabled={totalTickets() === 0}
                  onClick={() => setShowBuyModal(true)}
                >
                  {totalTickets() > 0 ? `Comprar ${totalTickets()} entrada${totalTickets() > 1 ? 's' : ''}` : 'Selecciona entradas'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy modal */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8 }}>🚧 Próximamente</h2>
            <p style={{ color: 'var(--white-60)', marginBottom: 24 }}>
              La compra de entradas estará disponible muy pronto. ¡Estamos terminando la pasarela de pago!
            </p>
            <button className="btn-primary" onClick={() => setShowBuyModal(false)} style={{ width: '100%', justifyContent: 'center' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

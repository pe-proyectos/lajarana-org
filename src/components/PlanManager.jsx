import { useState, useEffect } from 'react';
import { api, getToken, clearToken } from '../lib/api';

export default function PlanManager() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    api.getProfile()
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { clearToken(); window.location.href = '/login'; });
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await api.upgradeUnlimited();
      setUser(prev => ({ ...prev, plan: 'UNLIMITED', planStartedAt: res.planStartedAt, planExpiresAt: res.planExpiresAt }));
      setMessage({ type: 'success', text: '🎉 ¡Bienvenido al Plan Ilimitado!' });
      setShowUpgradeModal(false);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setUpgrading(false);
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.cancelPlan();
      setUser(prev => ({ ...prev, plan: 'FREE', planStartedAt: null, planExpiresAt: null }));
      setMessage({ type: 'success', text: 'Plan cancelado.' });
      setShowCancelModal(false);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setCancelling(false);
  }

  if (loading) return <div className="dash-layout"><div className="loading">Cargando...</div></div>;

  const isUnlimited = user?.plan === 'UNLIMITED';
  const freeEventsLeft = Math.max(0, 10 - (user?.freeEventsUsed || 0));

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <a href="/dashboard" className="logo">🎉 LaJarana</a>
        <div className="dash-header-right">
          <a href="/dashboard" className="btn-ghost btn-sm">← Dashboard</a>
          <a href="/dashboard/profile" className="btn-ghost btn-sm">Perfil</a>
        </div>
      </header>
      <div className="dash-content">
        <h1 className="dash-title gradient-text">Planes y Precios</h1>
        <p className="dash-subtitle">0% comisión en todas las entradas vendidas</p>

        {message && (
          <div className={message.type === 'success' ? 'success-msg' : 'error-msg'}>
            {message.text}
          </div>
        )}

        {/* Current plan status */}
        <div className="plan-current-card">
          <div className="plan-current-header">
            <div>
              <span className={`plan-badge ${isUnlimited ? 'plan-badge--pro' : 'plan-badge--free'}`}>
                {isUnlimited ? '⭐ ILIMITADO' : '🎫 GRATUITO'}
              </span>
              <h2 className="plan-current-name">{isUnlimited ? 'Plan Ilimitado' : 'Plan Gratuito'}</h2>
            </div>
            {isUnlimited && (
              <div className="plan-current-price">
                <span className="plan-price-amount">S/ 799</span>
                <span className="plan-price-period">/mes</span>
              </div>
            )}
          </div>
          {!isUnlimited && (
            <p style={{ color: 'var(--lime)', marginTop: 8 }}>
              🎁 {freeEventsLeft} evento{freeEventsLeft !== 1 ? 's' : ''} gratis restante{freeEventsLeft !== 1 ? 's' : ''} (máx. 50 entradas/evento)
            </p>
          )}
          {isUnlimited && user.planExpiresAt && (
            <p className="plan-expiry">
              Activo hasta: {new Date(user.planExpiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Free tier */}
        <div className="plan-comparison" style={{ marginTop: 32 }}>
          <h3>🎁 Eventos Gratuitos</h3>
          <p style={{ color: 'var(--white-60)', marginBottom: 16 }}>
            Tus primeros 10 eventos son gratis. Máximo 50 entradas por evento, 1 evento activo a la vez.
          </p>
        </div>

        {/* Packages */}
        <div className="plan-comparison" style={{ marginTop: 24 }}>
          <h3>📦 Paquetes por Evento</h3>
          <p style={{ color: 'var(--white-60)', marginBottom: 16 }}>
            Pago único por evento — sin comisiones.
          </p>
          <div className="plan-compare-grid">
            <div className="plan-compare-item">
              <span className="plan-compare-icon">🎟️</span>
              <h4>Hasta 100</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)' }}>S/ 300</p>
              <p>entradas</p>
            </div>
            <div className="plan-compare-item">
              <span className="plan-compare-icon">🎫</span>
              <h4>Hasta 1,000</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)' }}>S/ 500</p>
              <p>entradas</p>
            </div>
            <div className="plan-compare-item">
              <span className="plan-compare-icon">🎪</span>
              <h4>Hasta 10,000+</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--lime)' }}>S/ 1,000</p>
              <p>entradas</p>
            </div>
          </div>
        </div>

        {/* Per ticket */}
        <div className="plan-comparison" style={{ marginTop: 24 }}>
          <h3>🎯 Por Ticket (Personalizable)</h3>
          <p style={{ color: 'var(--white-60)', marginBottom: 8 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--violet)' }}>S/ 3</span> por ticket — elige la cantidad exacta que necesitas.
          </p>
          <p style={{ color: 'var(--white-40)', fontSize: '0.85rem' }}>
            Ejemplo: 120 tickets = S/ 360 · 250 tickets = S/ 750
          </p>
        </div>

        {/* Unlimited */}
        <div className="plan-comparison" style={{ marginTop: 24, border: isUnlimited ? '2px solid var(--violet)' : undefined }}>
          <h3>♾️ Plan Ilimitado</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--lime)' }}>S/ 799</span>
            <span style={{ color: 'var(--white-60)' }}>/mes</span>
          </div>
          <div className="plan-current-features">
            <div className="plan-feat"><span className="plan-feat-icon">✓</span> Eventos ilimitados</div>
            <div className="plan-feat"><span className="plan-feat-icon">✓</span> Entradas ilimitadas</div>
            <div className="plan-feat"><span className="plan-feat-icon">✓</span> 0% comisión</div>
            <div className="plan-feat"><span className="plan-feat-icon">✓</span> Analytics avanzados</div>
            <div className="plan-feat"><span className="plan-feat-icon">✓</span> Soporte prioritario</div>
          </div>
          <div className="plan-actions" style={{ marginTop: 16 }}>
            {isUnlimited ? (
              <button className="btn-secondary" onClick={() => setShowCancelModal(true)}>Cancelar suscripción</button>
            ) : (
              <button className="btn-primary" onClick={() => setShowUpgradeModal(true)}>Activar Plan Ilimitado →</button>
            )}
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>⭐</div>
              <h2>Activar Plan Ilimitado</h2>
              <p style={{ color: 'var(--white-60)', margin: '12px 0 24px' }}>
                S/ 799/mes — Eventos y entradas ilimitadas, sin comisiones.
              </p>
              <p style={{ color: 'var(--white-60)', fontSize: '0.85rem', marginBottom: 24 }}>
                Por ahora la activación es instantánea. La integración de pago estará disponible pronto.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleUpgrade} disabled={upgrading}>
                  {upgrading ? 'Activando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>😢</div>
              <h2>¿Cancelar Plan Ilimitado?</h2>
              <p style={{ color: 'var(--white-60)', margin: '12px 0 24px' }}>
                Volverás al plan gratuito. Tus eventos activos seguirán funcionando.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Mantener</button>
                <button className="btn-primary" style={{ background: 'var(--coral)' }} onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

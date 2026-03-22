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
      const res = await api.upgradePlan();
      setUser(prev => ({ ...prev, plan: 'PRO', planStartedAt: res.planStartedAt, planExpiresAt: res.planExpiresAt }));
      setMessage({ type: 'success', text: '🎉 ¡Bienvenido al Plan Pro!' });
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
      setMessage({ type: 'success', text: 'Plan cancelado. Volviste al Plan Comisión.' });
      setShowCancelModal(false);
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    }
    setCancelling(false);
  }

  if (loading) return <div className="dash-layout"><div className="loading">Cargando...</div></div>;

  const isPro = user?.plan === 'PRO';

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
        <h1 className="dash-title gradient-text">Mi Plan</h1>
        <p className="dash-subtitle">Gestiona tu suscripción</p>

        {message && (
          <div className={message.type === 'success' ? 'success-msg' : 'error-msg'}>
            {message.text}
          </div>
        )}

        <div className="plan-current-card">
          <div className="plan-current-header">
            <div>
              <span className={`plan-badge ${isPro ? 'plan-badge--pro' : 'plan-badge--free'}`}>
                {isPro ? '⭐ PRO' : '🎫 COMISIÓN'}
              </span>
              <h2 className="plan-current-name">{isPro ? 'Plan Pro' : 'Plan Comisión'}</h2>
            </div>
            <div className="plan-current-price">
              <span className="plan-price-amount">{isPro ? 'S/ 149' : 'S/ 0'}</span>
              <span className="plan-price-period">/mes</span>
            </div>
          </div>
          {isPro && user.planExpiresAt && (
            <p className="plan-expiry">
              Activo hasta: {new Date(user.planExpiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <div className="plan-current-features">
            {isPro ? (
              <>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Comisión 1%</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Eventos ilimitados</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Analytics avanzados</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Soporte prioritario</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> API access</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Badge verificado</div>
              </>
            ) : (
              <>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Comisión 3-5%</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Hasta 3 eventos</div>
                <div className="plan-feat"><span className="plan-feat-icon">✓</span> Soporte por chat</div>
              </>
            )}
          </div>
          <div className="plan-actions">
            {isPro ? (
              <button className="btn-secondary" onClick={() => setShowCancelModal(true)}>Cancelar suscripción</button>
            ) : (
              <button className="btn-primary" onClick={() => setShowUpgradeModal(true)}>Actualizar a Pro →</button>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="plan-comparison">
            <h3>¿Por qué actualizar a Pro?</h3>
            <div className="plan-compare-grid">
              <div className="plan-compare-item">
                <span className="plan-compare-icon">💰</span>
                <h4>Comisión 1%</h4>
                <p>Ahorra hasta 4% en cada venta</p>
              </div>
              <div className="plan-compare-item">
                <span className="plan-compare-icon">♾️</span>
                <h4>Sin límites</h4>
                <p>Crea todos los eventos que necesites</p>
              </div>
              <div className="plan-compare-item">
                <span className="plan-compare-icon">📊</span>
                <h4>Analytics</h4>
                <p>Datos detallados de tus ventas</p>
              </div>
              <div className="plan-compare-item">
                <span className="plan-compare-icon">⚡</span>
                <h4>Soporte VIP</h4>
                <p>Respuesta prioritaria 24/7</p>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>⭐</div>
              <h2>Actualizar a Plan Pro</h2>
              <p style={{ color: 'var(--white-60)', margin: '12px 0 24px' }}>
                S/ 149/mes — Comisión reducida al 1%, eventos ilimitados y más.
              </p>
              <p style={{ color: 'var(--white-60)', fontSize: '0.85rem', marginBottom: 24 }}>
                Por ahora la actualización es instantánea. La integración de pago estará disponible pronto.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleUpgrade} disabled={upgrading}>
                  {upgrading ? 'Actualizando...' : 'Confirmar actualización'}
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
              <h2>¿Cancelar Plan Pro?</h2>
              <p style={{ color: 'var(--white-60)', margin: '12px 0 24px' }}>
                Volverás al Plan Comisión con límite de 3 eventos y comisión de 3-5%.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Mantener Pro</button>
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

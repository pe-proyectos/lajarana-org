import { useState, useEffect } from 'react';
import { api, getToken, clearToken } from '../lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', company: '' });
  const [mpEmail, setMpEmail] = useState('');
  const [savingMp, setSavingMp] = useState(false);
  const [mpMessage, setMpMessage] = useState(null);

  useEffect(() => {
    if (!getToken()) { window.location.href = '/login'; return; }
    api.getProfile()
      .then(u => {
        setUser(u);
        setForm({ name: u.name || '', phone: u.phone || '', company: u.company || '' });
        setMpEmail(u.mpEmail || '');
        setLoading(false);
      })
      .catch(() => { clearToken(); window.location.href = '/login'; });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateProfile(form);
      setUser(prev => ({ ...prev, ...updated }));
      setMessage({ type: 'success', text: 'Perfil actualizado' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSaving(false);
  }

  if (loading) return <div className="dash-layout"><div className="loading">Cargando...</div></div>;

  async function handleSaveMp(e) {
    e.preventDefault();
    setSavingMp(true);
    setMpMessage(null);
    try {
      await api.updatePaymentMethod({ mpEmail });
      setMpMessage({ type: 'success', text: 'Método de pago actualizado' });
    } catch (err) {
      setMpMessage({ type: 'error', text: err.message });
    }
    setSavingMp(false);
  }

  const isUnlimited = user?.plan === 'UNLIMITED';

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <a href="/dashboard" className="logo"><img src="/logo.png" alt="LaJarana" style={{height:'32px',marginRight:'8px',verticalAlign:'middle'}} /> LaJarana</a>
        <div className="dash-header-right">
          <a href="/dashboard" className="btn-ghost btn-sm">← Dashboard</a>
          <a href="/dashboard/plan" className="btn-ghost btn-sm">Mi Plan</a>
        </div>
      </header>
      <div className="dash-content">
        <h1 className="dash-title gradient-text">Mi Perfil</h1>
        <p className="dash-subtitle">Información de tu cuenta</p>

        {message && (
          <div className={message.type === 'success' ? 'success-msg' : 'error-msg'}>
            {message.text}
          </div>
        )}

        <div className="profile-grid">
          <div className="form-card">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} />
                <span className="form-hint">El email no se puede cambiar</span>
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+51 999 999 999" />
              </div>
              <div className="form-group">
                <label>Empresa / Organización</label>
                <input className="form-input" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Nombre de tu empresa" />
              </div>
              <div className="form-actions">
                <button className="btn-primary btn-sm" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-sidebar">
            <div className="profile-plan-card">
              <span className={`plan-badge ${isUnlimited ? 'plan-badge--pro' : 'plan-badge--free'}`}>
                {isUnlimited ? '⭐ ILIMITADO' : '🎫 GRATUITO'}
              </span>
              <h3>{isUnlimited ? 'Plan Ilimitado' : 'Plan Gratuito'}</h3>
              {isUnlimited && user.planExpiresAt && (
                <p className="plan-expiry">
                  Hasta {new Date(user.planExpiresAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                </p>
              )}
              {!isUnlimited && (
                <a href="/dashboard/plan" className="btn-primary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                  Ver planes →
                </a>
              )}
            </div>

            <div className="profile-stats-card">
              <h3>Estadísticas</h3>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.stats?.eventsCreated || 0}</span>
                <span className="profile-stat-label">Eventos creados</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">{user.stats?.ticketsSold || 0}</span>
                <span className="profile-stat-label">Entradas vendidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div style={{ marginTop: 32 }}>
          <h2 className="dash-title" style={{ fontSize: '1.4rem' }}>💳 Método de Pago</h2>
          <p className="dash-subtitle" style={{ marginBottom: 16 }}>
            Configura tu cuenta de MercadoPago para recibir el dinero de tus ventas.
          </p>

          {mpMessage && (
            <div className={mpMessage.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginBottom: 16 }}>
              {mpMessage.text}
            </div>
          )}

          <div className="form-card" style={{ maxWidth: 500 }}>
            <form onSubmit={handleSaveMp}>
              <div className="form-group">
                <label>Email de MercadoPago</label>
                <input
                  className="form-input"
                  type="email"
                  value={mpEmail}
                  onChange={e => setMpEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
                <span className="form-hint">El email asociado a tu cuenta de MercadoPago donde recibirás los pagos.</span>
              </div>
              <div className="form-actions">
                <button className="btn-primary btn-sm" type="submit" disabled={savingMp}>
                  {savingMp ? 'Guardando...' : 'Guardar método de pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

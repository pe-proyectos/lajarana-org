import { useState } from 'react';
import { api, setToken } from '../lib/api';

export default function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', company: '', role: 'ORGANIZER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { ...form };
      if (!body.company) delete body.company;
      const data = await api.register(body);
      setToken(data.token || data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="gradient-text">Crear Cuenta de Organizador</h1>
        <p className="subtitle">Empieza a vender entradas para tus eventos</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input type="text" className="form-input" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" className="form-input" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Empresa / Productora (opcional)</label>
            <input type="text" className="form-input" value={form.company} onChange={e => update('company', e.target.value)} placeholder="Nombre de tu empresa o marca" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Registrando...' : 'Crear mi cuenta de organizador'}
          </button>
        </form>
        <div className="auth-link">
          ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
        </div>
        <div className="auth-link" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--white-06)' }}>
          ¿Buscas comprar entradas? <a href="https://lajarana.luminari.agency/register">Ir al sitio de compradores →</a>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { api, setToken } from '../lib/api';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setToken(data.token || data.access_token);
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      window.location.href = redirect || '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="gradient-text">Iniciar Sesión</h1>
        <p className="subtitle">Accede a tu panel de organizador</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="auth-link">
          ¿No tienes cuenta? <a href="/register">Regístrate como organizador</a>
        </div>
        <div className="auth-link" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--white-06)' }}>
          ¿Buscas comprar entradas? <a href="https://lajarana.luminari.agency/login">Ir al sitio de compradores →</a>
        </div>
      </div>
    </div>
  );
}

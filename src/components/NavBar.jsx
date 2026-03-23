import { useState, useEffect } from 'react';
import { getToken, clearToken } from '../lib/api';

export default function NavBar({ current = 'home' }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  function logout() {
    clearToken();
    window.location.href = '/';
  }

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="/" className="logo"><img src="/logo.png" alt="LaJarana" style={{height:'32px',marginRight:'8px',verticalAlign:'middle'}} /> LaJarana <span className="logo-tag">Organizadores</span></a>
        
        <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`hamburger ${menuOpen ? 'hamburger--open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          {loggedIn ? (
            <>
              <a href="/dashboard" className={current === 'dashboard' ? 'nav-active' : ''}>Dashboard</a>
              <a href="/dashboard/events/new" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>+ Crear Evento</a>
              <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: '0.9rem', cursor: 'pointer' }} onClick={logout}>Salir</button>
            </>
          ) : (
            <>
              <a href="/login" className={current === 'login' ? 'nav-active' : ''}>Iniciar Sesión</a>
              <a href="/register" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Empezar gratis</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

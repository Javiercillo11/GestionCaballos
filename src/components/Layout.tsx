import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function Layout() {
  const auth = useAuth();
  const online = useOnline();
  const email = auth.status === 'allowed' ? auth.user.email : null;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <p className="brand__name">Gestión de Caballos</p>
            <p className="brand__sub">Caballos · Clientes · Servicios</p>
          </div>
        </div>
        <nav className="nav" aria-label="Secciones">
          <NavLink to="/caballos" className="nav__link">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-6c0-4 2.6-6.7 6.3-7.6L14 4l1 2.8c1.9.9 3.2 2.6 3.2 4.7L17.5 14l-3-1-2.4 2V20" /></svg>
            Caballos
          </NavLink>
          <NavLink to="/servicios" className="nav__link">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
            Servicios
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <p className="sidebar__user" title={email ?? ''}>{email}</p>
          <button type="button" className="btn btn--ghost btn--sm logout-btn" onClick={() => void logout()} aria-label="Cerrar sesión" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>
            <span className="logout-btn__text">Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="main">
        {!online && (
          <div className="banner banner--warn" role="alert">
            Sin conexión a internet. Los datos pueden no estar actualizados y no se podrán guardar cambios hasta
            recuperarla.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}

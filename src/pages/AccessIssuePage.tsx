import { logout } from '../services/auth';

export function AccessIssuePage({ email, message }: { email: string | null; message?: string }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-card__title">{message ? 'Error de conexión' : 'Sin acceso'}</h1>
        <p className="auth-card__hint">
          {message ?? (
            <>
              La cuenta <strong>{email}</strong> no está autorizada para usar la aplicación. Pide al administrador que
              la añada a la lista de usuarios permitidos.
            </>
          )}
        </p>
        {message && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--block" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { errorMessage } from '../lib/errors';
import { login, resetPassword } from '../services/auth';

type Mode = 'login' | 'reset';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setInfo(null);
    if (!email.trim()) return setError('Introduce tu correo electrónico.');
    if (mode === 'login' && !password) return setError('Introduce tu contraseña.');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await resetPassword(email);
        setInfo('Si el correo está registrado, recibirás un enlace para restablecer la contraseña. Revisa también la carpeta de spam.');
      }
    } catch (err) {
      // Por privacidad no se revela si el correo existe al recuperar contraseña.
      if (mode === 'reset' && (err as { code?: string }).code === 'auth/user-not-found') {
        setInfo('Si el correo está registrado, recibirás un enlace para restablecer la contraseña.');
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand brand--large">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <p className="brand__name">Gestión de Caballos</p>
            <p className="brand__sub">Caballos · Clientes · Servicios</p>
          </div>
        </div>

        <h1 className="auth-card__title">{mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}</h1>
        {mode === 'reset' && (
          <p className="auth-card__hint">Introduce tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>
          {mode === 'login' && (
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </div>
          )}

          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="alert alert--success" role="status">
              {info}
            </p>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Enviar enlace'}
          </button>
        </form>

        <button
          type="button"
          className="link-btn"
          onClick={() => switchMode(mode === 'login' ? 'reset' : 'login')}
          disabled={busy}
        >
          {mode === 'login' ? '¿Has olvidado tu contraseña?' : '← Volver a iniciar sesión'}
        </button>
      </div>
    </div>
  );
}

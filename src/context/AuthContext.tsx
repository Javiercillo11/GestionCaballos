import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { isAllowedUser } from '../services/auth';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'notAllowed'; user: User }
  | { status: 'error'; user: User; message: string }
  | { status: 'allowed'; user: User };

const AuthContext = createContext<AuthState>({ status: 'loading' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'signedOut' });
        return;
      }
      setState({ status: 'loading' });
      try {
        const allowed = await isAllowedUser(user.uid);
        setState(allowed ? { status: 'allowed', user } : { status: 'notAllowed', user });
      } catch {
        setState({
          status: 'error',
          user,
          message: 'No se ha podido verificar tu acceso. Comprueba tu conexión e inténtalo de nuevo.',
        });
      }
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

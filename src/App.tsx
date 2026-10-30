import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AccessIssuePage } from './pages/AccessIssuePage';
import { DashboardPage } from './pages/DashboardPage';
import { HorsesPage } from './pages/HorsesPage';
import { LoginPage } from './pages/LoginPage';
import { ServicesPage } from './pages/ServicesPage';

export function App() {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <div className="auth-screen">
        <Spinner label="Comprobando sesión…" />
      </div>
    );
  }
  // Sin sesión no se monta ninguna ruta de gestión: solo la pantalla de acceso.
  if (auth.status === 'signedOut') return <LoginPage />;
  if (auth.status === 'notAllowed') return <AccessIssuePage email={auth.user.email} />;
  if (auth.status === 'error') return <AccessIssuePage email={auth.user.email} message={auth.message} />;

  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/resumen" element={<DashboardPage />} />
            <Route path="/caballos" element={<HorsesPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="*" element={<Navigate to="/resumen" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}

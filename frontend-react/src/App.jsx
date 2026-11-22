import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import RutaProtegida from './components/layout/RutaProtegida';
import { AlertasProvider } from './context/AlertasContext';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

// Contextos globales (alertas y sesión) envuelven a todas las pantallas.
export default function App() {
  return (
    <AlertasProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RutaProtegida />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </AlertasProvider>
  );
}

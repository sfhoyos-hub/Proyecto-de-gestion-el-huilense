import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import RutaProtegida from './components/layout/RutaProtegida';
import { AlertasProvider } from './context/AlertasContext';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import DomingosPage from './pages/DomingosPage';
import LoginPage from './pages/LoginPage';
import MeserosPage from './pages/MeserosPage';
import VentasPage from './pages/VentasPage';

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
                <Route path="/meseros" element={<MeserosPage />} />
                <Route path="/domingos" element={<DomingosPage />} />
                <Route path="/ventas" element={<VentasPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </AlertasProvider>
  );
}

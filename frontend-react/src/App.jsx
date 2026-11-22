import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './components/layout/RutaProtegida';
import Boton from './components/ui/Boton';
import { AlertasProvider } from './context/AlertasContext';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import LoginPage from './pages/LoginPage';

// Inicio provisional: el panel completo llega en el siguiente commit.
function InicioProvisional() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fondo">
      <h1 className="font-serif text-3xl font-bold text-huilense-700">Hola, {usuario?.name}</h1>
      <Boton variante="secundario" onClick={cerrarSesion}>Cerrar sesión</Boton>
    </main>
  );
}

// Contextos globales (alertas y sesión) envuelven a todas las pantallas.
export default function App() {
  return (
    <AlertasProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RutaProtegida />}>
              <Route path="/dashboard" element={<InicioProvisional />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </AlertasProvider>
  );
}

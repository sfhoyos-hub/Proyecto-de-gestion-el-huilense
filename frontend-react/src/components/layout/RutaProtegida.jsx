import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export const PAGINA_MESERO = '/mesero/ranking.html';

// Solo deja pasar al administrador. Sin sesión lleva al login; un mesero
// va a su vista de ranking (página anterior, aún no migrada a React).
export default function RutaProtegida() {
  const { estaAutenticado, esAdmin } = useAuth();

  if (!estaAutenticado) return <Navigate to="/login" replace />;
  if (!esAdmin) {
    window.location.replace(PAGINA_MESERO);
    return null;
  }
  return <Outlet />;
}

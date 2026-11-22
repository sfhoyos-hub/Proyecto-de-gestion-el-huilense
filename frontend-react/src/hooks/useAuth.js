import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Custom hook para leer la sesión: const { usuario, cerrarSesion } = useAuth();
export default function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}

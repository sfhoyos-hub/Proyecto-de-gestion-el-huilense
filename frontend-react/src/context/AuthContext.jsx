import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { peticion, EVENTO_SESION_EXPIRADA } from '../api/cliente';
import { guardarSesion, leerSesion, limpiarSesion } from '../api/sesion';

export const AuthContext = createContext(null);

// Contexto global de autenticación: guarda quién inició sesión y lo comparte
// con todas las pantallas (menú, rutas protegidas, cerrar sesión).
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [motivoSalida, setMotivoSalida] = useState('');

  useEffect(() => {
    const alExpirar = () => {
      setSesion(null);
      setMotivoSalida('Tu sesión expiró. Vuelve a iniciar sesión.');
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async ({ email, password }) => {
    const { token, usuario } = await peticion('/login', {
      metodo: 'POST',
      cuerpo: { email: email.trim().toLowerCase(), password },
      autenticada: false
    });
    guardarSesion(token, usuario);
    setSesion({ token, usuario });
    setMotivoSalida('');
    return usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    limpiarSesion();
    setSesion(null);
  }, []);

  const valor = useMemo(() => ({
    usuario: sesion?.usuario ?? null,
    estaAutenticado: Boolean(sesion),
    esAdmin: sesion?.usuario?.rol === 'ADMIN',
    motivoSalida,
    limpiarMotivo: () => setMotivoSalida(''),
    iniciarSesion,
    cerrarSesion
  }), [sesion, motivoSalida, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

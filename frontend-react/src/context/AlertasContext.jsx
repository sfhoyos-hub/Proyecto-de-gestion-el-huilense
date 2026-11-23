import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import ModalAlerta from '../components/ui/ModalAlerta';

export const AlertasContext = createContext(null);

// Contexto global de alertas: cualquier pantalla muestra una ventanita al frente con
// exito(), error(), advertencia() o pide confirmación con await confirmar().
export function AlertasProvider({ children }) {
  const [alerta, setAlerta] = useState(null);
  const resolver = useRef(null);

  const mostrar = useCallback((datos) => new Promise((resolve) => {
    resolver.current = resolve;
    setAlerta(datos);
  }), []);

  const responder = useCallback((respuesta) => {
    setAlerta(null);
    resolver.current?.(respuesta);
    resolver.current = null;
  }, []);

  const valor = useMemo(() => ({
    exito: (mensaje, opciones = {}) => mostrar({ tipo: 'exito', mensaje, ...opciones }),
    advertencia: (mensaje, opciones = {}) => mostrar({ tipo: 'advertencia', mensaje, ...opciones }),
    error: (errorOMensaje, opciones = {}) => mostrar({
      tipo: 'error',
      mensaje: errorOMensaje?.message || errorOMensaje || 'Ocurrió un error inesperado.',
      ...opciones
    }),
    confirmar: (mensaje, opciones = {}) => mostrar({ tipo: 'confirmar', mensaje, ...opciones })
  }), [mostrar]);

  return (
    <AlertasContext.Provider value={valor}>
      {children}
      <ModalAlerta alerta={alerta} onResponder={responder} />
    </AlertasContext.Provider>
  );
}

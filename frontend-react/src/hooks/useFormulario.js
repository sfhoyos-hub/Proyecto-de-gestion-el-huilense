import { useCallback, useState } from 'react';

// Custom hook de formularios: maneja valores, errores por campo y validación.
//   const { valores, errores, cambiar, validar, reiniciar } = useFormulario(iniciales, reglasPorCampo);
// reglasPorCampo: { campo: [regla1, regla2] } donde cada regla devuelve '' o un mensaje.
export default function useFormulario(valoresIniciales, reglasPorCampo = {}) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});

  const cambiar = useCallback((evento) => {
    const { name, value } = evento.target;
    setValores((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: '' }));
  }, []);

  const asignar = useCallback((campo, valor) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: '' }));
  }, []);

  // Devuelve la lista de mensajes de error (vacía si todo está bien).
  const validar = useCallback(() => {
    const nuevos = {};
    Object.entries(reglasPorCampo).forEach(([campo, reglasCampo]) => {
      const mensaje = reglasCampo.map((regla) => regla(valores[campo], valores)).find(Boolean);
      if (mensaje) nuevos[campo] = mensaje;
    });
    setErrores(nuevos);
    return Object.values(nuevos);
  }, [reglasPorCampo, valores]);

  const reiniciar = useCallback((nuevosValores = valoresIniciales) => {
    setValores(nuevosValores);
    setErrores({});
  }, [valoresIniciales]);

  return { valores, errores, cambiar, asignar, validar, reiniciar };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { peticion } from '../api/cliente';

// Criterios con los que el sistema elige a los meseros de un domingo
// (los mismos nombres que usa el backend).
export const ESTRATEGIAS = [
  { valor: 'rendimiento', texto: 'Por rendimiento (más ventas en los últimos domingos)' },
  { valor: 'antiguedad', texto: 'Por antigüedad (más tiempo en el restaurante)' }
];

// Custom hook de la convocatoria de un domingo: quiénes están convocados y
// quiénes descansan. Recibe el id del domingo (o null si no hay ninguno elegido).
export default function useConvocatoria(domingoId) {
  const [convocatoria, setConvocatoria] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(async () => {
    const numero = ++ultimaPeticion.current;

    if (!domingoId) {
      setConvocatoria(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const datos = await peticion(`/convocatorias/${domingoId}`);
      // Si mientras tanto se eligió otro domingo, esta respuesta ya no sirve.
      if (numero === ultimaPeticion.current) setConvocatoria(datos);
    } catch (problema) {
      if (numero === ultimaPeticion.current) {
        setConvocatoria(null);
        setError(problema);
      }
    } finally {
      if (numero === ultimaPeticion.current) setCargando(false);
    }
  }, [domingoId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const generar = useCallback(async (estrategia) => {
    const respuesta = await peticion('/convocatorias', {
      metodo: 'POST',
      cuerpo: { domingo_id: domingoId, estrategia }
    });
    await recargar();
    return respuesta;
  }, [domingoId, recargar]);

  const convocados = convocatoria?.convocados || [];
  const descanso = convocatoria?.descanso || [];

  return {
    convocados,
    descanso,
    estrategia: convocatoria?.estrategia || null,
    domingosConsiderados: convocatoria?.domingos_considerados ?? 0,
    nota: convocatoria?.nota || null,
    tieneConvocatoria: convocados.length + descanso.length > 0,
    cargando,
    error,
    recargar,
    generar
  };
}

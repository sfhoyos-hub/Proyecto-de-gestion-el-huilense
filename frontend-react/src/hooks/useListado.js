import { useCallback, useEffect, useState } from 'react';

// Custom hook genérico: carga una lista desde la API y permite recargarla.
//   const { datos, cargando, error, recargar } = useListado(() => peticion('/meseros'));
// "cargar" debe venir de useCallback para no repetir la carga en cada render.
export default function useListado(cargar) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    } catch (problema) {
      setError(problema);
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar };
}

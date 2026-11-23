import { useCallback } from 'react';
import { comoLista, peticion } from '../api/cliente';
import useListado from './useListado';

// Custom hook con los indicadores del panel principal.
export default function useResumen() {
  const cargar = useCallback(async () => {
    const [meseros, domingos] = await Promise.all([
      peticion('/meseros').then(comoLista),
      peticion('/domingos').then(comoLista)
    ]);
    const ultimo = domingos[0] || null;
    const ventas = ultimo ? comoLista(await peticion(`/ventas?fecha=${ultimo.fecha}`)) : [];

    return [{
      meserosActivos: meseros.filter((m) => m.estado === 'ACTIVO').length,
      totalMeseros: meseros.length,
      domingosRegistrados: domingos.length,
      domingosAbiertos: domingos.filter((d) => Number(d.cerrado) !== 1).length,
      ultimoDomingo: ultimo,
      ventasUltimoDomingo: ventas.reduce((suma, v) => suma + Number(v.total_vendido || 0), 0)
    }];
  }, []);

  const { datos, cargando, error, recargar } = useListado(cargar);
  return { resumen: datos[0] || null, cargando, error, recargar };
}

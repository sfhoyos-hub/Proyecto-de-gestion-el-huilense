import { useCallback, useMemo } from 'react';
import { comoLista, peticion } from '../api/cliente';
import useListado from './useListado';

// Custom hook de domingos: lista (más reciente primero), registro y cierre de corte.
// Al registrar, el backend convoca solo a los meseros con la estrategia elegida.
export default function useDomingos() {
  const cargar = useCallback(async () => comoLista(await peticion('/domingos')), []);
  const { datos: domingos, cargando, error, recargar } = useListado(cargar);

  const abiertos = useMemo(() => domingos.filter((d) => Number(d.cerrado) !== 1), [domingos]);

  const registrar = useCallback(async ({ fecha, meseros_requeridos, estrategia }) => {
    const respuesta = await peticion('/domingos', {
      metodo: 'POST',
      cuerpo: { fecha, meseros_requeridos: Number(meseros_requeridos), estrategia }
    });
    await recargar();
    return respuesta;
  }, [recargar]);

  const cerrarCorte = useCallback(async (id) => {
    const respuesta = await peticion(`/domingos/${id}/cerrar-corte`, { metodo: 'POST' });
    await recargar();
    return respuesta;
  }, [recargar]);

  return { domingos, abiertos, cargando, error, recargar, registrar, cerrarCorte };
}

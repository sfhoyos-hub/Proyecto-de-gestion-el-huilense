import { useCallback, useMemo } from 'react';
import { comoLista, peticion } from '../api/cliente';
import useListado from './useListado';

// Custom hook de meseros: lista, registro, edición y cambio de estado.
export default function useMeseros() {
  const cargar = useCallback(async () => comoLista(await peticion('/meseros')), []);
  const { datos: meseros, cargando, error, recargar } = useListado(cargar);

  const activos = useMemo(() => meseros.filter((m) => m.estado === 'ACTIVO'), [meseros]);

  const registrar = useCallback(async (datos) => {
    const respuesta = await peticion('/meseros', { metodo: 'POST', cuerpo: datos });
    await recargar();
    return respuesta;
  }, [recargar]);

  const actualizar = useCallback(async (id, datos) => {
    const respuesta = await peticion(`/meseros/${id}`, { metodo: 'PUT', cuerpo: datos });
    await recargar();
    return respuesta;
  }, [recargar]);

  const cambiarEstado = useCallback(async (id, estado) => {
    const respuesta = await peticion(`/meseros/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado } });
    await recargar();
    return respuesta;
  }, [recargar]);

  return { meseros, activos, cargando, error, recargar, registrar, actualizar, cambiarEstado };
}

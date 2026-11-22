import { useCallback } from 'react';
import { comoLista, peticion } from '../api/cliente';
import useListado from './useListado';

// Custom hook de ventas de un domingo. Recibe la fecha (YYYY-MM-DD) por parámetro.
export default function useVentas(fecha) {
  const cargar = useCallback(async () => {
    if (!fecha) return [];
    return comoLista(await peticion(`/ventas?fecha=${encodeURIComponent(fecha)}`));
  }, [fecha]);
  const { datos: ventas, cargando, error, recargar } = useListado(cargar);

  const total = ventas.reduce((suma, v) => suma + Number(v.total_vendido || 0), 0);

  const cuerpoVenta = ({ mesero_id, fecha: fechaVenta, total_vendido }) => ({
    mesero_id: Number(mesero_id),
    fecha: fechaVenta,
    total_vendido: Number(total_vendido)
  });

  const registrar = useCallback(async (datos) => {
    const respuesta = await peticion('/ventas', { metodo: 'POST', cuerpo: cuerpoVenta(datos) });
    await recargar();
    return respuesta;
  }, [recargar]);

  const editar = useCallback(async (id, datos) => {
    const respuesta = await peticion(`/ventas/${id}`, { metodo: 'PUT', cuerpo: cuerpoVenta(datos) });
    await recargar();
    return respuesta;
  }, [recargar]);

  return { ventas, total, cargando, error, recargar, registrar, editar };
}

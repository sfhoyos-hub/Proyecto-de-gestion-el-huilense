import { leerSesion, limpiarSesion } from './sesion';

const TIEMPO_MAXIMO_MS = 15000;
export const EVENTO_SESION_EXPIRADA = 'huilense:sesion-expirada';

export class ApiError extends Error {
  constructor(mensaje, { estado = null, tipo = 'http' } = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.estado = estado;
    this.tipo = tipo;
  }
}

async function enviar(ruta, opciones) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  try {
    return await fetch(ruta, { ...opciones, signal: controlador.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder.', { tipo: 'timeout' });
    }
    throw new ApiError('No hay conexión con el servidor. Verifica que esté encendido.', { tipo: 'red' });
  } finally {
    clearTimeout(temporizador);
  }
}

// peticion('/meseros', { metodo: 'POST', cuerpo: {...} })
export async function peticion(ruta, { metodo = 'GET', cuerpo, autenticada = true } = {}) {
  const cabeceras = { 'Content-Type': 'application/json' };
  const sesion = leerSesion();

  if (autenticada && sesion) {
    cabeceras.Authorization = `Bearer ${sesion.token}`;
  }

  const respuesta = await enviar(ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });

  const datos = await respuesta.json().catch(() => null);

  // 401 en una ruta protegida = la sesión venció: se avisa a AuthContext.
  if (respuesta.status === 401 && autenticada) {
    limpiarSesion();
    window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
  }

  if (!respuesta.ok) {
    throw new ApiError(datos?.mensaje || 'No se pudo completar la operación.', { estado: respuesta.status });
  }

  return datos;
}

// Las rutas de listado devuelven un arreglo (o { data: [...] } en versiones viejas).
export function comoLista(respuesta) {
  return Array.isArray(respuesta) ? respuesta : respuesta?.data || [];
}

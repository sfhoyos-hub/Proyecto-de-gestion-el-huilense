/* ==========================================================================
   El Huilense · capa de acceso a la API (compartida por todas las pantallas)
   Se expone un único objeto global: window.Huilense
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- Configuración ---------- */
  const CONFIG = Object.freeze({
    // El backend escucha en el puerto 3000 (o el puerto configurado en tu entorno)
    API_BASE_URL: 'http://localhost:3000',
    TIMEOUT_MS: 15000,
    PAGINA_LOGIN: 'index.html',
    PAGINA_PANEL: 'dashboard.html',
    // Activado en true para permitir el salto directo al panel de administración
    PANEL_DISPONIBLE: true
  });

  /* ---------- Sesión ---------- */
  const CLAVE_SESION = 'elhuilense.sesion';

  const Sesion = {
    guardar(token, usuario) {
      const { id, name, email, rol } = usuario;
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario: { id, name, email, rol } }));
    },

    leer() {
      try {
        const crudo = sessionStorage.getItem(CLAVE_SESION);
        if (!crudo) return null;
        const datos = JSON.parse(crudo);
        const valida = datos && typeof datos.token === 'string' && datos.usuario &&
          typeof datos.usuario.rol === 'string';
        return valida ? datos : null;
      } catch (error) {
        return null;
      }
    },

    limpiar() {
      try {
        sessionStorage.removeItem(CLAVE_SESION);
      } catch (error) {
        /* sin almacenamiento disponible */
      }
    }
  };

  /* ---------- Errores de la API ---------- */
  class ApiError extends Error {
    constructor(mensaje, { tipo = 'http', estado = 0, detalle = '' } = {}) {
      super(mensaje);
      this.name = 'ApiError';
      this.tipo = tipo;
      this.estado = estado;
      this.detalle = detalle;
    }
  }

  function mensajePorEstado(estado) {
    if (estado === 400) return 'La solicitud no es válida.';
    if (estado === 401) return 'Tu sesión no es válida o expiró.';
    if (estado === 403) return 'No tienes permisos para esta operación.';
    if (estado === 404) return 'No se encontró el recurso solicitado.';
    if (estado >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo.';
    return 'No se pudo completar la solicitud.';
  }

  /* ---------- Petición genérica ---------- */
  async function peticion(ruta, { metodo = 'GET', cuerpo, autenticada = true } = {}) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), CONFIG.TIMEOUT_MS);

    const cabeceras = { Accept: 'application/json' };
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';

    if (autenticada) {
      const sesion = Sesion.leer();
      if (sesion) cabeceras.Authorization = 'Bearer ' + sesion.token;
    }

    let respuesta;
    let datos = null;

    try {
      respuesta = await fetch(CONFIG.API_BASE_URL + ruta, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        signal: controlador.signal
      });

      const texto = await respuesta.text();
      if (texto) {
        try {
          datos = JSON.parse(texto);
        } catch (errorJson) {
          datos = null;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('El servidor tardó demasiado en responder.', { tipo: 'timeout' });
      }
      throw new ApiError('No se pudo conectar con el servidor.', { tipo: 'red' });
    } finally {
      clearTimeout(temporizador);
    }

    if (!respuesta.ok) {
      if (respuesta.status === 401 && autenticada) {
        Sesion.limpiar();
        global.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-expirada');
      }
      const mensaje = datos && typeof datos.mensaje === 'string'
        ? datos.mensaje
        : mensajePorEstado(respuesta.status);
      const detalle = datos && typeof datos.error === 'string' ? datos.error : '';
      throw new ApiError(mensaje, { tipo: 'http', estado: respuesta.status, detalle });
    }

    if (datos === null) {
      throw new ApiError('El servidor respondió con un formato inesperado.', {
        tipo: 'respuesta-invalida',
        estado: respuesta.status
      });
    }

    return datos;
  }

  global.Huilense = Object.freeze({ CONFIG, Sesion, ApiError, peticion });
})(window);
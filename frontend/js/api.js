// frontend/js/api.js
(function () {
  'use strict';

  // Ajuste dinámico del entorno (local o producción)
  const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;

  // Carpeta del frontend, deducida de dónde se cargó api.js.
  // Así las redirecciones funcionan con Express (/) y con Live Preview (/frontend/).
  const RAIZ = (function () {
    try {
      return new URL('../', document.currentScript.src).pathname;
    } catch (e) {
      return '/';
    }
  })();

  const CONFIG = {
    API_BASE_URL: BASE_URL,
    PAGINA_LOGIN: RAIZ + 'index.html',
    PAGINA_PANEL: RAIZ + 'dashboard.html',          // ADMIN
    PAGINA_MESERO: RAIZ + 'mesero/ranking.html',    // MESERO
    PANEL_DISPONIBLE: true,
    TIMEOUT_MS: 15000
  };

  const CLAVE_TOKEN = 'huilense_token';
  const CLAVE_ROL = 'huilense_rol';
  const CLAVE_USUARIO = 'huilense_usuario';

  /* ---------- Error de API (tipo: 'red' | 'timeout' | 'respuesta-invalida' | 'http') ---------- */
  class ApiError extends Error {
    constructor(mensaje, { tipo = 'http', estado = null, datos = null } = {}) {
      super(mensaje);
      this.name = 'ApiError';
      this.tipo = tipo;
      this.estado = estado;
      this.status = estado; // alias usado por mesero-ranking.js
      this.datos = datos;
    }
  }

  /* ---------- Sesión ---------- */
  const Sesion = {
    guardar(token, usuario) {
      localStorage.setItem(CLAVE_TOKEN, token);
      localStorage.setItem(CLAVE_ROL, usuario.rol);
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    },
    leer() {
      try {
        const token = localStorage.getItem(CLAVE_TOKEN);
        const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO));
        return token && usuario && usuario.rol ? { token, usuario } : null;
      } catch (e) {
        return null;
      }
    },
    limpiar() {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_ROL);
      localStorage.removeItem(CLAVE_USUARIO);
    }
  };

  /* ---------- Petición ---------- */
  // peticion('/ruta', { metodo: 'GET', cuerpo: {...}, autenticada: true })
  async function peticion(endpoint, { metodo = 'GET', cuerpo, autenticada = true, headers = {} } = {}) {
    const cabeceras = { 'Content-Type': 'application/json', ...headers };

    if (autenticada) {
      const sesion = Sesion.leer();
      if (sesion) cabeceras['Authorization'] = 'Bearer ' + sesion.token;
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), CONFIG.TIMEOUT_MS);

    let respuesta;
    try {
      respuesta = await fetch(CONFIG.API_BASE_URL + endpoint, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        signal: controlador.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('El servidor tardó demasiado en responder.', { tipo: 'timeout' });
      }
      throw new ApiError('Error de conexión con el servidor. Intente más tarde.', { tipo: 'red' });
    } finally {
      clearTimeout(temporizador);
    }

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch (e) {
      if (respuesta.ok) {
        throw new ApiError('La respuesta del servidor no tiene el formato esperado.', {
          tipo: 'respuesta-invalida',
          estado: respuesta.status
        });
      }
    }

    // 401 en una ruta protegida = sesión vencida. (El 403 es "sin permiso": no cierra sesión.)
    if (respuesta.status === 401 && autenticada) {
      Sesion.limpiar();
      window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-expirada');
    }

    if (!respuesta.ok) {
      throw new ApiError((datos && (datos.mensaje || datos.error)) || 'Error en la petición', {
        tipo: 'http',
        estado: respuesta.status,
        datos
      });
    }

    return datos;
  }

  window.Huilense = window.Huilense || {};
  Object.assign(window.Huilense, {
    CONFIG,
    Sesion,
    ApiError,
    peticion,

    // Compatibilidad con mesero-ranking.js
    getToken() {
      const s = Sesion.leer();
      return s ? s.token : null;
    },
    getRol() {
      return localStorage.getItem(CLAVE_ROL);
    },
    setSesion(token, rol, usuario) {
      Sesion.guardar(token, { ...(usuario || {}), rol });
    },
    cerrarSesion() {
      Sesion.limpiar();
      window.location.href = CONFIG.PAGINA_LOGIN;
    },
    obtenerRankingMiPuesto(fecha) {
      return peticion('/ranking/mi-puesto?fecha=' + encodeURIComponent(fecha), { metodo: 'GET' });
    }
  });
})();
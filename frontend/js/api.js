/* ==========================================================================
   El Huilense · capa de acceso a la API (compartida por todas las pantallas)
   Se expone un único objeto global: window.Huilense
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- Configuración ---------- */
  const CONFIG = Object.freeze({
    // El backend (backend/app.js) escucha en el puerto 3000, fijo en el código.
    API_BASE_URL: 'http://localhost:3000',
    TIMEOUT_MS: 15000,
    PAGINA_LOGIN: 'index.html',
    PAGINA_PANEL: 'dashboard.html',
    // El panel se construye en la Etapa 3. Mientras sea false, el login
    // verifica la sesión pero NO redirige a una página que aún no existe.
    PANEL_DISPONIBLE: false
  });

  /* ---------- Sesión ----------
     SEGURIDAD: el token JWT se guarda en sessionStorage. Implicaciones:
     - Es legible por cualquier JavaScript de esta página: un fallo XSS
       permitiría robarlo. Por eso el código usa textContent y no innerHTML
       con datos externos.
     - Se borra al cerrar la pestaña (más seguro que localStorage, que
       persiste), pero no se comparte entre pestañas.
     - Una cookie httpOnly sería más segura, pero exigiría cambiar el backend.
     - Nunca se guarda la contraseña. El backend sigue validando cada petición. */
  const CLAVE_SESION = 'elhuilense.sesion';

  const Sesion = {
    // Puede lanzar un error si el navegador bloquea el almacenamiento.
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
        /* sin almacenamiento disponible: no hay nada que limpiar */
      }
    }
  };

  /* ---------- Errores de la API ----------
     tipo: 'http' | 'red' | 'timeout' | 'respuesta-invalida' */
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

  /* ---------- Petición genérica ----------
     peticion('/ruta', { metodo, cuerpo, autenticada })
     - Añade "Authorization: Bearer <token>" si hay sesión y autenticada !== false.
     - Si una ruta protegida responde 401, limpia la sesión y vuelve al login.
     - Devuelve el JSON ya interpretado o lanza ApiError. */
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

      // La respuesta puede no ser JSON (por ejemplo, la página de error de un proxy).
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
      // Los errores del backend traen { mensaje } y, a veces, { error } con el detalle.
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

/* ==========================================================================
   El Huilense · lógica de la pantalla de inicio de sesión
   ===========================================================================
  */
(function () {
  'use strict';

  const { CONFIG, Sesion, ApiError, peticion } = window.Huilense;

  /* ---------- Referencias al DOM ---------- */
  const formulario = document.querySelector('#form-login');
  const zonaMensajes = document.querySelector('#zona-mensajes');
  const botonEntrar = document.querySelector('#btn-entrar');
  const textoBoton = botonEntrar.querySelector('.boton__texto');
  const estadoCarga = document.querySelector('#estado-carga');
  const botonOjo = document.querySelector('#btn-ojo');
  const iconoOjo = botonOjo.querySelector('i');
  const botonAyuda = document.querySelector('#btn-ayuda');
  const botonCerrarAyuda = document.querySelector('#btn-ayuda-cerrar');
  const panelAyuda = document.querySelector('#panel-ayuda');

  // Un objeto por campo: { input, contenedor, error }, indexado por el id del input
  const campos = {};
  document.querySelectorAll('.campo__input').forEach((input) => {
    campos[input.id] = {
      input,
      contenedor: input.closest('.campo'),
      error: document.querySelector('#' + input.id + '-error')
    };
  });

  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let cargando = false;

  /* ---------- Validación (cada función devuelve '' si es válido) ---------- */
  const validadores = {
    email(valor) {
      const texto = valor.trim();
      if (!texto) return 'Escribe tu correo electrónico.';
      if (!REGEX_EMAIL.test(texto)) return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
      return '';
    },
    password(valor) {
      // No se recorta ni se exige longitud: el backend decide si es correcta.
      return valor ? '' : 'Escribe tu contraseña.';
    }
  };

  /* ---------- Utilidades de DOM seguras (solo textContent) ---------- */
  function crearIcono(clase) {
    const icono = document.createElement('i');
    icono.className = 'bi ' + clase;
    icono.setAttribute('aria-hidden', 'true');
    return icono;
  }

  function crearTexto(texto) {
    const span = document.createElement('span');
    span.textContent = texto;
    return span;
  }

  // Muestra u oculta el error de un campo. Devuelve true si el campo es válido.
  function marcarCampo(campo, mensaje) {
    const invalido = mensaje !== '';
    campo.contenedor.classList.toggle('campo--invalida', invalido);

    if (invalido) {
      campo.input.setAttribute('aria-invalid', 'true');
      campo.error.replaceChildren(crearIcono('bi-exclamation-triangle-fill'), crearTexto(mensaje));
    } else {
      campo.input.removeAttribute('aria-invalid');
      campo.error.replaceChildren();
    }
    return !invalido;
  }

  // Valida todos los campos; devuelve el primer input inválido (o null)
  function validarFormulario() {
    let primerInvalido = null;
    Object.keys(validadores).forEach((id) => {
      const campo = campos[id];
      const valido = marcarCampo(campo, validadores[id](campo.input.value));
      if (!valido && !primerInvalido) primerInvalido = campo.input;
    });
    return primerInvalido;
  }

  /* ---------- Mensajes globales (región aria-live) ---------- */
  function limpiarMensajes() {
    zonaMensajes.replaceChildren();
  }

  function mostrarMensaje(tipo, texto, accion) {
    const iconos = {
      error: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
      exito: 'bi-check-circle-fill'
    };

    const caja = document.createElement('div');
    caja.className = 'alert mensaje mensaje--' + tipo + ' d-flex align-items-start gap-2';

    const cuerpo = document.createElement('div');
    cuerpo.append(crearTexto(texto));

    if (accion) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'mensaje__accion d-block mt-1';
      boton.textContent = accion.texto;
      boton.addEventListener('click', accion.alHacerClic);
      cuerpo.append(boton);
    }

    caja.append(crearIcono(iconos[tipo]), cuerpo);
    zonaMensajes.replaceChildren(caja);
  }

  /* ---------- Estado de carga ---------- */
  function establecerCargando(activo) {
    cargando = activo;
    botonEntrar.disabled = activo;
    botonEntrar.setAttribute('aria-busy', String(activo));
    textoBoton.textContent = activo ? 'Verificando credenciales…' : 'Iniciar sesión';
    estadoCarga.textContent = activo ? 'Verificando credenciales, espera un momento.' : '';
    // readOnly (y no disabled) para no perder el foco ni los valores
    Object.values(campos).forEach((campo) => { campo.input.readOnly = activo; });
  }

  /* ---------- Mostrar / ocultar contraseña ---------- */
  function alternarPassword() {
    const input = campos.password.input;
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    botonOjo.setAttribute('aria-pressed', String(mostrar));
    iconoOjo.classList.toggle('bi-eye', !mostrar);
    iconoOjo.classList.toggle('bi-eye-slash', mostrar);
  }

  function ocultarPassword() {
    if (campos.password.input.type === 'text') alternarPassword();
  }

  /* ---------- Respuesta del servidor ---------- */
  // Comprueba que la respuesta tenga la forma documentada antes de confiar en ella.
  function extraerSesion(datos) {
    const usuario = datos && datos.usuario;
    const tokenPlausible = datos && typeof datos.token === 'string' &&
      datos.token.split('.').length === 3; // un JWT tiene 3 segmentos
    const usuarioValido = usuario && typeof usuario === 'object' &&
      Number.isInteger(usuario.id) &&
      typeof usuario.name === 'string' &&
      typeof usuario.email === 'string' &&
      typeof usuario.rol === 'string';

    if (!tokenPlausible || !usuarioValido) {
      throw new ApiError('La respuesta del servidor no tiene el formato esperado.', {
        tipo: 'respuesta-invalida'
      });
    }
    return { token: datos.token, usuario };
  }

  function textoDeError(error) {
    if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    if (error.tipo === 'red') {
      return 'No se pudo conectar con el servidor (' + CONFIG.API_BASE_URL +
        '). Comprueba que el backend esté en ejecución.';
    }
    return error.message; // timeout, respuesta inválida o { mensaje } del backend
  }

  /* ---------- Resultado del acceso ---------- */
  function mostrarSesionActiva(usuario) {
    mostrarMensaje(
      'exito',
      'Acceso verificado: ' + usuario.name + ' (administrador). ' +
        'El panel de administración todavía no está habilitado en esta versión.',
      {
        texto: 'Cerrar sesión',
        alHacerClic() {
          Sesion.limpiar();
          limpiarMensajes();
          campos.email.input.focus();
        }
      }
    );
  }

  function completarAcceso(usuario) {
    if (CONFIG.PANEL_DISPONIBLE) {
      window.location.assign(usuario.rol === 'MESERO' ? CONFIG.PAGINA_MESERO : CONFIG.PAGINA_PANEL);
      return;
    }
    mostrarSesionActiva(usuario);
  }

  /* ---------- Envío del formulario ---------- */
  async function manejarEnvio(evento) {
    evento.preventDefault(); // la petición se hace con fetch, sin recargar la página
    if (cargando) return;

    limpiarMensajes();
    const primerInvalido = validarFormulario();
    if (primerInvalido) {
      primerInvalido.focus();
      return;
    }

    const email = campos.email.input.value.trim();
    const password = campos.password.input.value;
    let destinoFoco = null;

    establecerCargando(true);
    ocultarPassword();

    try {
      const datos = await peticion('/login', {
        metodo: 'POST',
        cuerpo: { email, password },
        autenticada: false
      });

      const { token, usuario } = extraerSesion(datos);
      campos.password.input.value = ''; // la contraseña ya no se necesita

      // Se admiten ADMIN y MESERO; en otro caso el token se descarta sin guardarlo.
      if (usuario.rol !== 'ADMIN' && usuario.rol !== 'MESERO') {
        mostrarMensaje('error', 'Esta cuenta no tiene un rol con acceso al sistema.');
        destinoFoco = campos.email.input;
        return;
      }
      if (usuario.estado !== 'activo') {
        mostrarMensaje('error', 'La cuenta se encuentra inactiva.');
        destinoFoco = campos.email.input;
        return;
      }

      try {
        Sesion.guardar(token, usuario);
      } catch (errorAlmacenamiento) {
        mostrarMensaje('error', 'El navegador bloqueó el almacenamiento de la sesión. Revisa la configuración de privacidad e inténtalo de nuevo.');
        return;
      }

      completarAcceso(usuario);
    } catch (error) {
      // Solo se registra el tipo de fallo: nunca el cuerpo de la petición ni la contraseña.
      console.error('Falló el inicio de sesión:', error.tipo || error.name);
      mostrarMensaje('error', textoDeError(error));

      if (error instanceof ApiError && error.estado === 401) {
        campos.password.input.value = '';
        destinoFoco = campos.password.input;
      }
    } finally {
      establecerCargando(false);
      if (destinoFoco) destinoFoco.focus();
    }
  }

  /* ---------- Ayuda flotante ---------- */
  function alternarAyuda(forzarAbierto) {
    const abrir = typeof forzarAbierto === 'boolean'
      ? forzarAbierto
      : !panelAyuda.classList.contains('ayuda__panel--abierto');

    panelAyuda.classList.toggle('ayuda__panel--abierto', abrir);
    botonAyuda.setAttribute('aria-expanded', String(abrir));
  }

  /* ---------- Inicio ---------- */
  const MOTIVOS = new Map([
    ['sesion-expirada', 'Tu sesión expiró. Inicia sesión de nuevo.'],
    ['sesion-cerrada', 'Cerraste la sesión correctamente.']
  ]);

  function iniciar() {
    // Eventos del formulario
    formulario.addEventListener('submit', manejarEnvio);
    botonOjo.addEventListener('click', alternarPassword);

    document.querySelectorAll('.campo__input').forEach((input) => {
      // Al escribir: si el campo tenía error, se revalida para quitarlo en cuanto se corrige
      input.addEventListener('input', () => {
        if (input.closest('.campo').classList.contains('campo--invalida')) {
          marcarCampo(campos[input.id], validadores[input.id](input.value));
        }
      });
      // Al salir del campo: se avisa solo si ya hay contenido inválido
      input.addEventListener('blur', () => {
        if (input.value !== '') {
          marcarCampo(campos[input.id], validadores[input.id](input.value));
        }
      });
    });

    // Eventos de la ayuda
    botonAyuda.addEventListener('click', () => alternarAyuda());
    botonCerrarAyuda.addEventListener('click', () => {
      alternarAyuda(false);
      botonAyuda.focus();
    });
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && panelAyuda.classList.contains('ayuda__panel--abierto')) {
        alternarAyuda(false);
        botonAyuda.focus();
      }
    });
    document.addEventListener('click', (evento) => {
      if (!evento.target.closest('.ayuda')) alternarAyuda(false);
    });

    // Sesión previa o motivo de redirección
    const sesion = Sesion.leer();
    if (sesion && (sesion.usuario.rol === 'ADMIN' || sesion.usuario.rol === 'MESERO')) {
      if (CONFIG.PANEL_DISPONIBLE) {
        window.location.replace(sesion.usuario.rol === 'MESERO' ? CONFIG.PAGINA_MESERO : CONFIG.PAGINA_PANEL);
        return;
      }
      mostrarSesionActiva(sesion.usuario);
    } else {
      if (sesion) Sesion.limpiar(); // sesión de un rol no permitido
      const motivo = MOTIVOS.get(new URLSearchParams(window.location.search).get('motivo'));
      if (motivo) mostrarMensaje('info', motivo);
    }
  }

  iniciar();
})();
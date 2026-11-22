/* ==========================================================================
   El Huilense · Módulo único de alertas (js/ui/alertas.js)
   Solo muestra avisos: sin lógica de negocio ni de red. Sin dependencias.
   Expone window.Huilense.Alertas
   ========================================================================== */
(function () {
  'use strict';

  const DURACION_TOAST_MS = 3500;
  const SALIDA_TOAST_MS = 180;

  const TIPOS = {
    error: { icono: '✕', titulo: 'Ha ocurrido un error' },
    advertencia: { icono: '!', titulo: 'Revisa la información' },
    info: { icono: 'i', titulo: 'Información' },
    confirmar: { icono: '?', titulo: 'Confirma la acción' }
  };

  let piezas = null;          // <dialog> y sus partes: se crea una sola vez
  let zonaToasts = null;      // contenedor aria-live de los toasts
  let cola = Promise.resolve(); // las ventanas se muestran una detrás de otra

  /* ---------- Utilidades de DOM (solo textContent) ---------- */
  function crear(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function crearBoton(clase) {
    const boton = crear('button', 'alerta__boton ' + clase);
    boton.type = 'button';
    return boton;
  }

  /* ---------- Ventana modal ---------- */
  function construirDialogo() {
    const dialogo = crear('dialog', 'alerta');
    const icono = crear('div', 'alerta__icono');
    const titulo = crear('h2', 'alerta__titulo');
    const texto = crear('p', 'alerta__texto');
    const cancelar = crearBoton('alerta__boton--secundario');
    const aceptar = crearBoton('alerta__boton--primario');
    const acciones = crear('div', 'alerta__acciones');
    titulo.id = 'alerta-titulo';
    texto.id = 'alerta-texto';
    icono.setAttribute('aria-hidden', 'true');
    dialogo.setAttribute('aria-labelledby', titulo.id);
    dialogo.setAttribute('aria-describedby', texto.id);
    acciones.append(cancelar, aceptar);
    dialogo.append(icono, titulo, texto, acciones);
    return { dialogo, icono, titulo, texto, cancelar, aceptar };
  }

  function obtenerDialogo() {
    if (piezas) return piezas;
    piezas = construirDialogo();
    piezas.aceptar.addEventListener('click', () => piezas.dialogo.close('confirmar'));
    piezas.cancelar.addEventListener('click', () => piezas.dialogo.close('cancelar'));
    document.body.append(piezas.dialogo);
    return piezas;
  }

  function pintar(partes, config) {
    const tipo = TIPOS[config.tipo];
    partes.dialogo.dataset.tipo = config.tipo;
    partes.icono.textContent = tipo.icono;
    partes.titulo.textContent = config.titulo || tipo.titulo;
    partes.texto.textContent = config.texto;
    partes.aceptar.textContent = config.etiquetaAceptar;
    partes.cancelar.textContent = config.etiquetaCancelar;
    partes.cancelar.hidden = !config.conCancelar;
  }

  function devolverFoco(elemento) {
    if (elemento && elemento.isConnected && typeof elemento.focus === 'function') {
      elemento.focus();
    }
  }

  // Abre la ventana y resuelve true solo si se pulsó el botón primario (Esc = false).
  function abrir(config) {
    const partes = obtenerDialogo();
    const focoPrevio = document.activeElement;
    pintar(partes, config);
    partes.dialogo.returnValue = '';
    return new Promise((resolver) => {
      partes.dialogo.addEventListener('close', () => {
        devolverFoco(focoPrevio);
        resolver(partes.dialogo.returnValue === 'confirmar');
      }, { once: true });
      partes.dialogo.showModal();
      partes.aceptar.focus();
    });
  }

  function encolar(config) {
    const resultado = cola.then(() => abrir(config));
    cola = resultado.catch(() => {});
    return resultado;
  }

  function avisar(tipo, texto, titulo) {
    return encolar({
      tipo, texto, titulo, etiquetaAceptar: 'Aceptar', etiquetaCancelar: '', conCancelar: false
    }).then(() => undefined);
  }

  /* ---------- Toast de éxito ---------- */
  function obtenerZonaToasts() {
    if (zonaToasts) return zonaToasts;
    zonaToasts = crear('div', 'alertas-toasts');
    zonaToasts.setAttribute('aria-live', 'polite');
    document.body.append(zonaToasts);
    return zonaToasts;
  }

  function cerrarToast(toast) {
    if (toast.classList.contains('toast-alerta--saliendo')) return;
    toast.classList.add('toast-alerta--saliendo');
    setTimeout(() => toast.remove(), SALIDA_TOAST_MS);
  }

  function crearToast(texto) {
    const toast = crear('button', 'toast-alerta');
    const icono = crear('span', 'toast-alerta__icono', '✓');
    icono.setAttribute('aria-hidden', 'true');
    toast.type = 'button';
    toast.title = 'Clic para cerrar';
    toast.append(icono, crear('span', 'toast-alerta__texto', texto));
    toast.addEventListener('click', () => cerrarToast(toast));
    return toast;
  }

  /* ---------- API pública ---------- */
  function exito(texto) {
    const toast = crearToast(texto);
    obtenerZonaToasts().append(toast);
    setTimeout(() => cerrarToast(toast), DURACION_TOAST_MS);
  }

  function confirmar(texto, { titulo, confirmar: etiquetaOk = 'Confirmar', cancelar: etiquetaNo = 'Cancelar' } = {}) {
    return encolar({
      tipo: 'confirmar', texto, titulo, etiquetaAceptar: etiquetaOk, etiquetaCancelar: etiquetaNo, conCancelar: true
    });
  }

  function deError(error) {
    const texto = (error && error.message) || 'Ocurrió un error inesperado.';
    return avisar('error', texto);
  }

  window.Huilense = window.Huilense || {};
  window.Huilense.Alertas = {
    error: (texto, titulo) => avisar('error', texto, titulo),
    advertencia: (texto, titulo) => avisar('advertencia', texto, titulo),
    info: (texto, titulo) => avisar('info', texto, titulo),
    exito,
    confirmar,
    deError
  };
})();

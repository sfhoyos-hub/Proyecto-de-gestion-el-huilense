/* ==========================================================================
   El Huilense · Lógica del Dashboard SaaS (dashboard.js)
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, peticion, CONFIG } = window.Huilense;

  // 1. Validar Sesión Activa
  const sesionActual = Sesion?.leer ? Sesion.leer() : null;
  if (!sesionActual || sesionActual.usuario?.rol !== 'ADMIN') {
    window.location.replace((CONFIG?.PAGINA_LOGIN || '/index.html') + '?motivo=sesion-expirada');
    return;
  }

  // Cargar datos de usuario en la interfaz
  const nombreAdminElem = document.getElementById('nombre-admin');
  if (nombreAdminElem) {
    nombreAdminElem.textContent = sesionActual.usuario.name || sesionActual.usuario.nombre || 'Admin';
  }

  const emailElem = document.getElementById('dropdown-admin-email');
  if (emailElem && sesionActual.usuario.email) {
    emailElem.textContent = sesionActual.usuario.email;
  }

  // Evento Cerrar Sesión
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      if (Sesion?.limpiar) Sesion.limpiar();
      window.location.replace((CONFIG?.PAGINA_LOGIN || '/index.html') + '?motivo=sesion-cerrada');
    });
  }

  // Contenedor de Alertas
  const zonaMensajes = document.getElementById('zona-mensajes');

  function mostrarAlerta(tipo, texto) {
    if (!zonaMensajes) return;
    const clases = { exito: 'alert-success', error: 'alert-danger', info: 'alert-info' };
    zonaMensajes.innerHTML = `
      <div class="alert ${clases[tipo] || 'alert-info'} alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
        <i class="bi ${tipo === 'exito' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
        ${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  // Modales Instanciados
  const elemModalPago = document.getElementById('modalPago');
  const modalPagoBs = elemModalPago ? bootstrap.Modal.getOrCreateInstance(elemModalPago) : null;

  const elemModalDomingo = document.getElementById('modalDomingo');
  const modalDomingoBs = elemModalDomingo ? bootstrap.Modal.getOrCreateInstance(elemModalDomingo) : null;

  const elemModalVenta = document.getElementById('modalVenta');
  const modalVentaBs = elemModalVenta ? bootstrap.Modal.getOrCreateInstance(elemModalVenta) : null;

  const elemModalCierre = document.getElementById('modalCierre');
  const modalCierreBs = elemModalCierre ? bootstrap.Modal.getOrCreateInstance(elemModalCierre) : null;

  // Estado local
  const meserosMap = new Map();
  let fechaUltimoDomingo = '';
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  // 2. Cargar Jornadas Dominicales
  async function cargarJornadas() {
    const tablaCuerpo = document.getElementById('tabla-domingos-cuerpo');
    if (!tablaCuerpo) return;

    try {
      const respuesta = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      const domingos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      if (domingos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Sin jornadas registradas.</td></tr>`;
        return;
      }

      const ultimo = domingos[0]; // Orden DESC desde la API
      if (ultimo) {
        const kpiFecha = document.getElementById('kpi-fecha-domingo');
        const kpiCount = document.getElementById('kpi-meseros-count');
        if (kpiFecha) kpiFecha.textContent = ultimo.fecha || '--/--/----';
        if (kpiCount) kpiCount.textContent = ultimo.meseros_requeridos || '0';
        fechaUltimoDomingo = ultimo.fecha;
        cargarVentas(ultimo.fecha);
      }

      tablaCuerpo.innerHTML = domingos.map(d => `
        <tr>
          <td class="fw-bold text-muted">#${d.id}</td>
          <td class="fw-semibold text-huilense">${esc(d.fecha)}</td>
          <td><span class="badge bg-huilense-soft text-huilense px-2 py-1">${d.meseros_requeridos} Meseros</span></td>
          <td class="text-end">
            ${Number(d.cerrado) === 1
              ? '<span class="badge bg-secondary-subtle text-secondary px-2 py-1">Cerrado</span>'
              : `<button class="btn btn-sm btn-outline-huilense btn-preparar-cierre py-0 px-2" data-id="${d.id}">Cerrar</button>`}
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-preparar-cierre').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const inputCierreId = document.getElementById('cierre-domingo-id');
          if (inputCierreId) inputCierreId.value = e.currentTarget.dataset.id;
          if (modalCierreBs) modalCierreBs.show();
        });
      });

    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-danger">Error: ${esc(error.message)}</td></tr>`;
    }
  }

  // 3. Meseros activos (selector) y ventas reales del último domingo
  async function cargarMeseros() {
    try {
      const respuesta = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      const meseros = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      const select = document.getElementById('venta-mesero-id');
      if (!select) return;

      select.innerHTML = '<option value="">Selecciona un mesero…</option>';

      meseros.forEach((m) => {
        meserosMap.set(m.id, `${m.nombre || ''} ${m.apellido || ''}`.trim());
        if (m.estado === 'activo' || m.estado === undefined) {
          const opcion = document.createElement('option');
          opcion.value = m.id;
          opcion.textContent = `${m.nombre || ''} ${m.apellido || ''} ${m.identificacion ? '(' + m.identificacion + ')' : ''}`;
          select.appendChild(opcion);
        }
      });
    } catch (error) {
      mostrarAlerta('error', 'No se pudo cargar la lista de meseros: ' + esc(error.message));
    }
  }

  async function cargarVentas(fecha) {
    const tablaCuerpo = document.getElementById('tabla-ventas-cuerpo');
    const kpiTotal = document.getElementById('kpi-total-ventas');
    if (!tablaCuerpo) return;

    try {
      const ventas = await peticion(`/ventas?fecha=${encodeURIComponent(fecha)}`, { metodo: 'GET', autenticada: true });
      const listadoVentas = Array.isArray(ventas) ? ventas : (ventas?.data || []);

      if (listadoVentas.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No hay ventas registradas para este domingo.</td></tr>`;
        if (kpiTotal) kpiTotal.textContent = '$0';
        return;
      }

      const total = listadoVentas.reduce((suma, v) => suma + Number(v.total_vendido || 0), 0);
      if (kpiTotal) kpiTotal.textContent = '$' + total.toLocaleString('es-CO');

      tablaCuerpo.innerHTML = listadoVentas.map(v => `
        <tr>
          <td class="fw-bold text-huilense">${esc(v.nombre || 'Mesero')} ${esc(v.apellido || '')}</td>
          <td>${esc(v.fecha)}</td>
          <td class="text-end fw-bold text-success">$${Number(v.total_vendido || 0).toLocaleString('es-CO')}</td>
        </tr>
      `).join('');
    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-danger">Error: ${esc(error.message)}</td></tr>`;
    }
  }

  // Al abrir modal de ventas, autocompletar con el último domingo
  if (elemModalVenta) {
    elemModalVenta.addEventListener('show.bs.modal', () => {
      const campoFecha = document.getElementById('venta-fecha');
      if (campoFecha && !campoFecha.value && fechaUltimoDomingo) {
        campoFecha.value = fechaUltimoDomingo;
      }
    });
  }

  // 4. Submit Registrar Domingo
  const formDomingo = document.getElementById('form-domingo');
  if (formDomingo) {
    formDomingo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fecha = document.getElementById('fecha-domingo')?.value;
      const meseros_requeridos = Number(document.getElementById('meseros-requeridos')?.value || 0);

      try {
        const respuesta = await peticion('/domingos', { metodo: 'POST', cuerpo: { fecha, meseros_requeridos }, autenticada: true });
        mostrarAlerta('exito', respuesta.mensaje || 'Domingo registrado correctamente.');
        e.target.reset();
        if (modalDomingoBs) modalDomingoBs.hide();
        cargarJornadas();
      } catch (error) {
        mostrarAlerta('error', error.message || 'Error al registrar el domingo.');
      }
    });
  }

  // 5. Submit Registrar Venta
  const formVenta = document.getElementById('form-venta');
  if (formVenta) {
    formVenta.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mesero_id = Number(document.getElementById('venta-mesero-id')?.value);
      const fecha = document.getElementById('venta-fecha')?.value;
      const total_vendido = Number(document.getElementById('venta-total')?.value);

      if (!mesero_id) {
        mostrarAlerta('error', 'Selecciona un mesero.');
        return;
      }

      try {
        const respuesta = await peticion('/ventas', { metodo: 'POST', cuerpo: { mesero_id, fecha, total_vendido }, autenticada: true });
        mostrarAlerta('exito', respuesta.mensaje || 'Venta registrada con éxito.');
        
        if (fecha === fechaUltimoDomingo) cargarVentas(fecha);

        e.target.reset();
        if (modalVentaBs) modalVentaBs.hide();
      } catch (error) {
        mostrarAlerta('error', error.message || 'Error al registrar la venta.');
      }
    });
  }

  // 6. Submit Cierre de Corte
  const formCierre = document.getElementById('form-cierre');
  if (formCierre) {
    formCierre.addEventListener('submit', async (e) => {
      e.preventDefault();
      const domingoId = document.getElementById('cierre-domingo-id')?.value;
      const contenedorRanking = document.getElementById('resultado-ranking');
      const listaBadges = document.getElementById('lista-ranking-badges');
      const placeholder = document.getElementById('ranking-placeholder');

      try {
        const respuesta = await peticion(`/domingos/${domingoId}/cerrar-corte`, { metodo: 'POST', autenticada: true });
        mostrarAlerta('exito', respuesta.mensaje || 'Corte dominical cerrado con éxito.');
        if (modalCierreBs) modalCierreBs.hide();
        cargarJornadas();

        if (respuesta.top6 && Array.isArray(respuesta.top6)) {
          if (contenedorRanking) contenedorRanking.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';

          if (listaBadges) {
            listaBadges.innerHTML = respuesta.top6.map((mId, index) => `
              <span class="badge bg-huilense text-white fs-6 p-2 rounded-pill shadow-sm">
                #${index + 1} ${esc(meserosMap.get(mId) || 'Mesero ID: ' + mId)}
              </span>
            `).join('');
          }
        }
      } catch (error) {
        mostrarAlerta('error', error.message || 'Error al realizar el cierre de corte.');
      }
    });
  }

  // 7. Cargar Listado de Pagos
  async function cargarPagos() {
    const tablaCuerpo = document.getElementById('tabla-pagos-cuerpo');
    if (!tablaCuerpo) return;

    try {
      const respuesta = await peticion('/pagos', { metodo: 'GET', autenticada: true });
      const pagos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      if (pagos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">No hay pagos registrados aún.</td></tr>`;
        return;
      }

      tablaCuerpo.innerHTML = pagos.map(p => `
        <tr>
          <td class="fw-bold text-huilense">Mesero #${p.mesero_id}</td>
          <td>Jornada #${p.domingo_id || p.fecha || 'N/A'}</td>
          <td>$${Number(p.valor_base || 0).toLocaleString()}</td>
          <td class="text-success fw-semibold">+$${Number(p.bonificacion || 0).toLocaleString()}</td>
          <td class="text-end fw-bold text-dark">$${Number(p.total_pagado || ((p.valor_base || 0) + (p.bonificacion || 0))).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Módulo de pagos listo en el frontend.</td></tr>`;
    }
  }

  // 8. Submit Registrar Pago / Bono
  const formPago = document.getElementById('form-pago');
  if (formPago) {
    formPago.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mesero_id = Number(document.getElementById('pago-mesero-id')?.value);
      const domingo_id = Number(document.getElementById('pago-domingo-id')?.value);
      const valor_base = Number(document.getElementById('pago-base')?.value);
      const bonificacion = Number(document.getElementById('pago-bonificacion')?.value);

      try {
        const respuesta = await peticion('/pagos', { 
          metodo: 'POST', 
          cuerpo: { mesero_id, domingo_id, valor_base, bonificacion }, 
          autenticada: true 
        });
        mostrarAlerta('exito', respuesta.mensaje || 'Pago y bonificación registrados con éxito.');
        e.target.reset();
        if (modalPagoBs) modalPagoBs.hide();
        cargarPagos();
      } catch (error) {
        mostrarAlerta('error', error.message || 'Error al registrar el pago.');
      }
    });
  }

  // 9. Consultar y Generar Ranking / Bonificaciones
  const campoFechaRanking = document.getElementById('ranking-fecha');

  function formatoCOP(valor) {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  function obtenerFechaRanking() {
    const fecha = campoFechaRanking?.value;
    if (!fecha) {
      mostrarAlerta('error', 'Selecciona la fecha del domingo.');
      return null;
    }
    return fecha;
  }

  async function consultarRanking(soloTop6 = false) {
    const fecha = obtenerFechaRanking();
    if (!fecha) return;

    const contenedor = document.getElementById('tabla-ranking-contenedor');
    const cuerpo = document.getElementById('tabla-ranking-cuerpo');
    if (!cuerpo) return;

    try {
      const ruta = soloTop6
        ? `/ranking/top6?fecha=${encodeURIComponent(fecha)}`
        : `/ranking?fecha=${encodeURIComponent(fecha)}`;

      const respuesta = await peticion(ruta, { metodo: 'GET', autenticada: true });
      const registros = soloTop6 ? (respuesta?.top6 || []) : (respuesta?.ranking || []);

      cuerpo.innerHTML = registros.map(item => `
        <tr>
          <td class="fw-bold">${item.posicion}</td>
          <td>${esc(item.nombre)} ${esc(item.apellido)}</td>
          <td>${formatoCOP(item.total_vendido)}</td>
          <td>
            ${Number(item.top6) === 1
              ? '<span class="badge bg-success">Sí</span>'
              : '<span class="badge bg-secondary">No</span>'}
          </td>
        </tr>
      `).join('');

      if (registros.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No hay resultados para esta fecha.</td></tr>`;
      }

      if (contenedor) contenedor.style.display = 'block';
      mostrarAlerta('exito', 'Ranking consultado correctamente.');

    } catch (error) {
      mostrarAlerta('error', error.message);
    }
  }

  async function generarRanking() {
    const fecha = obtenerFechaRanking();
    if (!fecha) return;

    try {
      const respuesta = await peticion('/ranking/generar', {
        metodo: 'POST',
        cuerpo: { fecha },
        autenticada: true
      });

      mostrarAlerta('exito', respuesta.mensaje || 'Ranking generado correctamente.');
      await consultarRanking();
    } catch (error) {
      mostrarAlerta('error', error.message);
    }
  }

  async function consultarBonificaciones() {
    const fecha = obtenerFechaRanking();
    if (!fecha) return;

    const contenedor = document.getElementById('tabla-bonificaciones-contenedor');
    const cuerpo = document.getElementById('tabla-bonificaciones-cuerpo');
    if (!cuerpo) return;

    try {
      const respuesta = await peticion(`/bonificaciones?fecha=${encodeURIComponent(fecha)}`, {
        metodo: 'GET',
        autenticada: true
      });

      const registros = respuesta?.bonificaciones || [];

      cuerpo.innerHTML = registros.map(item => `
        <tr>
          <td>${esc(item.nombre)} ${esc(item.apellido)}</td>
          <td>${item.posicion}</td>
          <td class="fw-bold text-success">${formatoCOP(item.monto)}</td>
          <td>${esc(item.fecha_entrega || 'Sin fecha')}</td>
        </tr>
      `).join('');

      if (registros.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No hay bonificaciones registradas.</td></tr>`;
      }

      if (contenedor) contenedor.style.display = 'block';
      mostrarAlerta('exito', `Total de bonificaciones: ${formatoCOP(respuesta?.total_bonificaciones)}`);

    } catch (error) {
      mostrarAlerta('error', error.message);
    }
  }

  async function generarBonificaciones() {
    const fecha = obtenerFechaRanking();
    if (!fecha) return;

    try {
      const respuesta = await peticion('/bonificaciones/generar', {
        metodo: 'POST',
        cuerpo: { fecha },
        autenticada: true
      });

      mostrarAlerta('exito', respuesta.mensaje || 'Bonificaciones generadas correctamente.');
      await consultarBonificaciones();
    } catch (error) {
      mostrarAlerta('error', error.message);
    }
  }

  // Asociar botones con sus funciones (con verificación para evitar fallos si el elemento no existe)
  const btnConsultarRanking = document.getElementById('btn-consultar-ranking');
  if (btnConsultarRanking) btnConsultarRanking.addEventListener('click', () => consultarRanking());

  const btnGenerarRanking = document.getElementById('btn-generar-ranking');
  if (btnGenerarRanking) btnGenerarRanking.addEventListener('click', generarRanking);

  const btnConsultarBonos = document.getElementById('btn-consultar-bonos');
  if (btnConsultarBonos) btnConsultarBonos.addEventListener('click', consultarBonificaciones);

  const btnGenerarBonos = document.getElementById('btn-generar-bonos');
  if (btnGenerarBonos) btnGenerarBonos.addEventListener('click', generarBonificaciones);

  // Inicialización de datos
  cargarMeseros();
  cargarJornadas();
  cargarPagos();

})();
/* ==========================================================================
   El Huilense · Lógica del Dashboard SaaS (dashboard.js)
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, peticion, CONFIG } = window.Huilense;

  // 1. Validar Sesión Activa
  const sesionActual = Sesion.leer();
  if (!sesionActual || sesionActual.usuario.rol !== 'ADMIN') {
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-expirada');
    return;
  }

  // Cargar datos de usuario
  document.getElementById('nombre-admin').textContent = sesionActual.usuario.name || 'Admin';
  const emailElem = document.getElementById('dropdown-admin-email');
  if (emailElem && sesionActual.usuario.email) {
    emailElem.textContent = sesionActual.usuario.email;
  }

  document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
    Sesion.limpiar();
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-cerrada');
  });

  const zonaMensajes = document.getElementById('zona-mensajes');

  function mostrarAlerta(tipo, texto) {
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
  const modalDomingoBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDomingo'));
  const modalVentaBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVenta'));
  const modalCierreBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCierre'));

  // Array Local de Ventas
  const ventasSesion = [];

  // 2. Cargar Jornadas Dominicales
  async function cargarJornadas() {
    const tablaCuerpo = document.getElementById('tabla-domingos-cuerpo');
    try {
      const respuesta = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      const domingos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      if (domingos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Sin jornadas registradas.</td></tr>`;
        return;
      }

      const ultimo = domingos[domingos.length - 1];
      if (ultimo) {
        document.getElementById('kpi-fecha-domingo').textContent = ultimo.fecha || '--/--/----';
        document.getElementById('kpi-meseros-count').textContent = ultimo.meseros_requeridos || '0';
      }

      tablaCuerpo.innerHTML = domingos.map(d => `
        <tr>
          <td class="fw-bold text-muted">#${d.id}</td>
          <td class="fw-semibold text-huilense">${d.fecha}</td>
          <td><span class="badge bg-huilense-soft text-huilense px-2 py-1">${d.meseros_requeridos} Meseros</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-huilense btn-preparar-cierre py-0 px-2" data-id="${d.id}">
              Cerrar
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-preparar-cierre').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.getElementById('cierre-domingo-id').value = e.currentTarget.dataset.id;
          modalCierreBs.show();
        });
      });

    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-danger">Error: ${error.message}</td></tr>`;
    }
  }

  // 3. Renderizar Tabla de Ventas en Vivo
  function renderizarTablaVentas() {
    const tablaCuerpo = document.getElementById('tabla-ventas-cuerpo');
    if (ventasSesion.length === 0) {
      tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No hay ventas registradas en esta sesión.</td></tr>`;
      return;
    }

    tablaCuerpo.innerHTML = ventasSesion.map(v => `
      <tr>
        <td class="fw-bold text-huilense">Mesero #${v.mesero_id}</td>
        <td>${v.fecha}</td>
        <td class="text-end fw-bold text-success">$${Number(v.total_vendido).toLocaleString()}</td>
      </tr>
    `).join('');
  }

  // 4. Submit Registrar Domingo
  document.getElementById('form-domingo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('fecha-domingo').value;
    const meseros_requeridos = Number(document.getElementById('meseros-requeridos').value);

    try {
      const respuesta = await peticion('/domingos', { metodo: 'POST', cuerpo: { fecha, meseros_requeridos }, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Domingo registrado correctamente.');
      e.target.reset();
      modalDomingoBs.hide();
      cargarJornadas();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar el domingo.');
    }
  });

  // 5. Submit Registrar Venta
  document.getElementById('form-venta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mesero_id = Number(document.getElementById('venta-mesero-id').value);
    const fecha = document.getElementById('venta-fecha').value;
    const total_vendido = Number(document.getElementById('venta-total').value);

    try {
      const respuesta = await peticion('/ventas', { metodo: 'POST', cuerpo: { mesero_id, fecha, total_vendido }, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Venta registrada con éxito.');
      
      ventasSesion.unshift({ mesero_id, fecha, total_vendido });
      renderizarTablaVentas();

      const totalActualElem = document.getElementById('kpi-total-ventas');
      const actual = Number(totalActualElem.textContent.replace(/[^0-9.-]+/g, '')) || 0;
      totalActualElem.textContent = '$' + (actual + total_vendido).toLocaleString();

      e.target.reset();
      modalVentaBs.hide();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar la venta.');
    }
  });

  // 6. Submit Cierre de Corte
  document.getElementById('form-cierre').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domingoId = document.getElementById('cierre-domingo-id').value;
    const contenedorRanking = document.getElementById('resultado-ranking');
    const listaBadges = document.getElementById('lista-ranking-badges');
    const placeholder = document.getElementById('ranking-placeholder');

    try {
      const respuesta = await peticion(`/domingos/${domingoId}/cerrar-corte`, { metodo: 'POST', autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Corte dominical cerrado con éxito.');
      modalCierreBs.hide();
      cargarJornadas();

      if (respuesta.top6 && Array.isArray(respuesta.top6)) {
        contenedorRanking.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';

        listaBadges.innerHTML = respuesta.top6.map((mId, index) => `
          <span class="badge bg-huilense text-white fs-6 p-2 rounded-pill shadow-sm">
            #${index + 1} - Mesero ID: ${mId}
          </span>
        `).join('');
      }
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al realizar el cierre de corte.');
    }
  });

  // Carga Inicial
  cargarJornadas();

})();


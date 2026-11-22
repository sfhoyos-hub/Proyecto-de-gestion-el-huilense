/* ==========================================================================
   El Huilense · Página Ventas (ventas.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'ventas', titulo: 'Ventas' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;
  const { escapeHtml } = window.Huilense.Dom;

  // Modal instanciado
  const elemModalVenta = document.getElementById('modalVenta');
  const modalVentaBs = bootstrap.Modal.getOrCreateInstance(elemModalVenta);

  // Estado local
  let fechaUltimoDomingo = '';

  // 1. Último domingo (para cargar sus ventas y autocompletar la fecha del modal)
  async function cargarUltimoDomingo() {
    try {
      const respuesta = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      const domingos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      if (domingos.length === 0) return;

      const ultimo = domingos[0]; // Orden DESC desde la API
      fechaUltimoDomingo = ultimo.fecha;
      cargarVentas(ultimo.fecha);
    } catch (error) {
      const tablaCuerpo = document.getElementById('tabla-ventas-cuerpo');
      tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
    }
  }

  // 2. Meseros activos (selector) y ventas reales del último domingo
  function agregarOpcionMesero(select, m) {
    if (m.estado !== 'ACTIVO' && m.estado !== undefined) return;
    const opcion = document.createElement('option');
    opcion.value = m.id;
    opcion.textContent = `${m.nombre || ''} ${m.apellido || ''} ${m.identificacion ? '(' + m.identificacion + ')' : ''}`;
    select.appendChild(opcion);
  }

  async function cargarMeseros() {
    try {
      const respuesta = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      const meseros = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      const select = document.getElementById('venta-mesero-id');

      select.innerHTML = '<option value="">Selecciona un mesero…</option>';
      meseros.forEach((m) => agregarOpcionMesero(select, m));
    } catch (error) {
      Alertas.error('No se pudo cargar la lista de meseros: ' + error.message);
    }
  }

  async function cargarVentas(fecha) {
    const tablaCuerpo = document.getElementById('tabla-ventas-cuerpo');

    try {
      const ventas = await peticion(`/ventas?fecha=${encodeURIComponent(fecha)}`, { metodo: 'GET', autenticada: true });
      const listadoVentas = Array.isArray(ventas) ? ventas : (ventas?.data || []);

      if (listadoVentas.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No hay ventas registradas para este domingo.</td></tr>`;
        return;
      }

      tablaCuerpo.innerHTML = listadoVentas.map(v => `
        <tr>
          <td class="fw-bold text-huilense">${escapeHtml(v.nombre || 'Mesero')} ${escapeHtml(v.apellido || '')}</td>
          <td>${escapeHtml(v.fecha)}</td>
          <td class="text-end fw-bold text-success">$${Number(v.total_vendido || 0).toLocaleString('es-CO')}</td>
        </tr>
      `).join('');
    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
    }
  }

  // Al abrir modal de ventas, autocompletar con el último domingo
  elemModalVenta.addEventListener('show.bs.modal', () => {
    const campoFecha = document.getElementById('venta-fecha');
    if (!campoFecha.value && fechaUltimoDomingo) {
      campoFecha.value = fechaUltimoDomingo;
    }
  });

  // 3. Submit Registrar Venta
  function leerVenta() {
    return {
      mesero_id: Number(document.getElementById('venta-mesero-id').value),
      fecha: document.getElementById('venta-fecha').value,
      total_vendido: Number(document.getElementById('venta-total').value)
    };
  }

  document.getElementById('form-venta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = leerVenta();
    if (!datos.mesero_id) {
      Alertas.advertencia('Selecciona un mesero.');
      return;
    }

    try {
      const respuesta = await peticion('/ventas', { metodo: 'POST', cuerpo: datos, autenticada: true });
      Alertas.exito(respuesta.mensaje || 'Venta registrada con éxito.');
      if (datos.fecha === fechaUltimoDomingo) cargarVentas(datos.fecha);
      e.target.reset();
      modalVentaBs.hide();
    } catch (error) {
      Alertas.deError(error);
    }
  });

  // Inicialización de datos
  cargarMeseros();
  cargarUltimoDomingo();
})();

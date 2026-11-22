/* ==========================================================================
   El Huilense · Página Bonificaciones (bonificaciones.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'bonificaciones', titulo: 'Bonificaciones' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;
  const { escapeHtml, formatoCOP } = window.Huilense.Dom;

  const campoFechaBonificaciones = document.getElementById('bonificaciones-fecha');

  function obtenerFechaBonificaciones() {
    const fecha = campoFechaBonificaciones.value;
    if (!fecha) {
      Alertas.advertencia('Selecciona la fecha del domingo.');
      return null;
    }
    return fecha;
  }

  function filaBonificacion(item) {
    return `
      <tr>
        <td>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</td>
        <td>${item.posicion}</td>
        <td class="fw-bold text-success">${formatoCOP(item.monto)}</td>
        <td>${escapeHtml(item.fecha_entrega || 'Sin fecha')}</td>
      </tr>`;
  }

  function pintarBonificaciones(cuerpo, registros) {
    cuerpo.innerHTML = registros.length === 0
      ? `<tr><td colspan="4" class="text-center py-3 text-muted">No hay bonificaciones registradas.</td></tr>`
      : registros.map(filaBonificacion).join('');
  }

  function mostrarTotalBonificaciones(total) {
    document.getElementById('total-bonificaciones').textContent = `Total de bonificaciones: ${formatoCOP(total)}`;
  }

  async function consultarBonificaciones() {
    const fecha = obtenerFechaBonificaciones();
    if (!fecha) return;

    const contenedor = document.getElementById('tabla-bonificaciones-contenedor');
    const cuerpo = document.getElementById('tabla-bonificaciones-cuerpo');

    try {
      const ruta = `/bonificaciones?fecha=${encodeURIComponent(fecha)}`;
      const respuesta = await peticion(ruta, { metodo: 'GET', autenticada: true });
      pintarBonificaciones(cuerpo, respuesta?.bonificaciones || []);
      mostrarTotalBonificaciones(respuesta?.total_bonificaciones);
      contenedor.style.display = 'block';
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function generarBonificaciones() {
    const fecha = obtenerFechaBonificaciones();
    if (!fecha) return;

    try {
      const respuesta = await peticion('/bonificaciones/generar', {
        metodo: 'POST',
        cuerpo: { fecha },
        autenticada: true
      });

      Alertas.exito(respuesta.mensaje || 'Bonificaciones generadas correctamente.');
      await consultarBonificaciones();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('btn-consultar-bonos').addEventListener('click', consultarBonificaciones);
  document.getElementById('btn-generar-bonos').addEventListener('click', generarBonificaciones);
})();

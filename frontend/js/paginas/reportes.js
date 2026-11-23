/* ==========================================================================
   El Huilense · Página Reportes e Historial (reportes.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'reportes', titulo: 'Reportes' })) return;

  const { peticion, Alertas } = window.Huilense;
  const { escapeHtml, formatoCOP } = window.Huilense.Dom;

  function filaResumen(f) {
    return `
      <tr>
        <td>${escapeHtml(f.nombre)} ${escapeHtml(f.apellido)}</td>
        <td>${f.domingos_trabajados}</td>
        <td>${formatoCOP(f.total_vendido)}</td>
        <td>${f.veces_top6}</td>
        <td>${f.mejor_posicion ?? '—'}</td>
        <td>${formatoCOP(f.total_bonificaciones)}</td>
        <td>${f.racha_actual}</td>
        <td><button type="button" class="btn btn-sm btn-outline-huilense" data-historial="${f.mesero_id}">Ver</button></td>
      </tr>`;
  }

  async function generar(evento) {
    evento.preventDefault();
    const desde = document.getElementById('rep-desde').value;
    const hasta = document.getElementById('rep-hasta').value;
    if (!desde || !hasta) return Alertas.advertencia('Selecciona el rango de fechas.');
    try {
      const reporte = await peticion(`/reportes/resumen?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
      document.getElementById('rep-totales').textContent =
        `Total vendido: ${formatoCOP(reporte.totales.total_vendido)} · Bonificaciones: ${formatoCOP(reporte.totales.total_bonificaciones)}`;
      document.getElementById('rep-resumen').innerHTML = reporte.filas.map(filaResumen).join('') ||
        '<tr><td colspan="8" class="text-center py-3 text-muted">Sin datos.</td></tr>';
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function verHistorial(meseroId) {
    try {
      const reporte = await peticion(`/reportes/historial/${encodeURIComponent(meseroId)}`);
      document.getElementById('rep-historial-titulo').textContent = reporte.titulo;
      document.getElementById('rep-historial').innerHTML = reporte.filas.length === 0
        ? '<tr><td colspan="5" class="text-center py-3 text-muted">Sin ventas registradas.</td></tr>'
        : reporte.filas.map((f) => `
          <tr>
            <td>${escapeHtml(f.fecha)}</td>
            <td>${formatoCOP(f.total_vendido)}</td>
            <td>${f.posicion ?? '—'}</td>
            <td>${Number(f.top6) === 1 ? 'Sí' : 'No'}</td>
            <td>${f.bonificacion ? `${formatoCOP(f.bonificacion)} (${escapeHtml(f.estado_bonificacion)})` : '—'}</td>
          </tr>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('form-reporte').addEventListener('submit', generar);
  document.getElementById('rep-resumen').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-historial]');
    if (boton) verHistorial(boton.dataset.historial);
  });
})();

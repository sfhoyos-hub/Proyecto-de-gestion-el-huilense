/* ==========================================================================
   El Huilense · Página Ranking / Top 6 (ranking.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'ranking', titulo: 'Ranking' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;
  const { escapeHtml, formatoCOP } = window.Huilense.Dom;

  const campoFechaRanking = document.getElementById('ranking-fecha');

  function obtenerFechaRanking() {
    const fecha = campoFechaRanking.value;
    if (!fecha) {
      Alertas.advertencia('Selecciona la fecha del domingo.');
      return null;
    }
    return fecha;
  }

  function filaRanking(item) {
    const badge = Number(item.top6) === 1
      ? '<span class="badge bg-success">Sí</span>'
      : '<span class="badge bg-secondary">No</span>';
    return `
      <tr>
        <td class="fw-bold">${item.posicion}</td>
        <td>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</td>
        <td>${formatoCOP(item.total_vendido)}</td>
        <td>${badge}</td>
      </tr>`;
  }

  function pintarRanking(cuerpo, registros) {
    cuerpo.innerHTML = registros.length === 0
      ? `<tr><td colspan="4" class="text-center py-3 text-muted">No hay resultados para esta fecha.</td></tr>`
      : registros.map(filaRanking).join('');
  }

  async function consultarRanking(soloTop6 = false) {
    const fecha = obtenerFechaRanking();
    if (!fecha) return;

    const contenedor = document.getElementById('tabla-ranking-contenedor');
    const cuerpo = document.getElementById('tabla-ranking-cuerpo');

    try {
      const ruta = soloTop6
        ? `/ranking/top6?fecha=${encodeURIComponent(fecha)}`
        : `/ranking?fecha=${encodeURIComponent(fecha)}`;
      const respuesta = await peticion(ruta, { metodo: 'GET', autenticada: true });
      pintarRanking(cuerpo, soloTop6 ? (respuesta?.top6 || []) : (respuesta?.ranking || []));
      contenedor.style.display = 'block';
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('btn-consultar-ranking').addEventListener('click', () => consultarRanking());
})();

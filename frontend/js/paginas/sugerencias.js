/* ==========================================================================
   El Huilense · Buzón de sugerencias del administrador (sugerencias.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'sugerencias', titulo: 'Sugerencias' })) return;

  const { peticion, Alertas } = window.Huilense;
  const { escapeHtml } = window.Huilense.Dom;

  async function cargar() {
    try {
      const sugerencias = await peticion('/sugerencias');
      document.getElementById('lista-sugerencias').innerHTML = sugerencias.length === 0
        ? '<tr><td colspan="2" class="text-center py-3 text-muted">No hay sugerencias todavía.</td></tr>'
        : sugerencias.map((s) => `
          <tr>
            <td class="text-nowrap">${escapeHtml(new Date(s.fecha).toLocaleString('es-CO'))}</td>
            <td>${escapeHtml(s.contenido)}</td>
          </tr>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  cargar();
})();

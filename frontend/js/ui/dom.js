/* ==========================================================================
   El Huilense · Utilidades de DOM y formato compartidas (dom.js)
   ========================================================================== */
(function () {
  'use strict';

  const CARACTERES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escapeHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (ch) => CARACTERES_HTML[ch]);
  }

  function formatoCOP(valor) {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  window.Huilense = window.Huilense || {};
  window.Huilense.Dom = { escapeHtml, formatoCOP };
})();

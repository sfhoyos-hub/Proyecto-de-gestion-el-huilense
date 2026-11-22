/* ==========================================================================
   El Huilense · Página Dashboard: KPIs de bienvenida (dashboard.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'dashboard', titulo: 'Dashboard' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;

  // Total de ventas del domingo (parte de KPI de la antigua cargarVentas)
  async function cargarTotalVentas(fecha) {
    const ventas = await peticion(`/ventas?fecha=${encodeURIComponent(fecha)}`, { metodo: 'GET', autenticada: true });
    const listadoVentas = Array.isArray(ventas) ? ventas : (ventas?.data || []);
    const total = listadoVentas.reduce((suma, v) => suma + Number(v.total_vendido || 0), 0);
    document.getElementById('kpi-total-ventas').textContent = '$' + total.toLocaleString('es-CO');
  }

  // KPIs del último domingo (parte de KPI de la antigua cargarJornadas)
  async function cargarKpis() {
    try {
      const respuesta = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      const domingos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      if (domingos.length === 0) return;

      const ultimo = domingos[0]; // Orden DESC desde la API
      document.getElementById('kpi-fecha-domingo').textContent = ultimo.fecha || '--/--/----';
      document.getElementById('kpi-meseros-count').textContent = ultimo.meseros_requeridos || '0';
      await cargarTotalVentas(ultimo.fecha);
    } catch (error) {
      Alertas.deError(error);
    }
  }

  // Inicialización de datos
  cargarKpis();
})();

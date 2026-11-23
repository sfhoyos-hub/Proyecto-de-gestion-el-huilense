/* ==========================================================================
   El Huilense · Página Pagos por Nequi (pagos.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'pagos', titulo: 'Pagos Nequi' })) return;

  const { peticion, Alertas } = window.Huilense;
  const { escapeHtml, formatoCOP } = window.Huilense.Dom;

  const campoFecha = document.getElementById('pagos-fecha');
  const ESTILO_ESTADO = { confirmado: 'bg-success', error: 'bg-danger', pendiente: 'bg-warning text-dark', cancelado: 'bg-secondary' };

  function filaBonificacion(b) {
    const pagada = b.estado === 'PAGADA';
    const accion = pagada
      ? '<span class="text-muted small">—</span>'
      : `<button type="button" class="btn btn-sm btn-huilense" data-pagar="${b.id}">Pagar por Nequi</button>`;
    return `
      <tr>
        <td>${b.posicion}</td>
        <td>${escapeHtml(b.nombre)} ${escapeHtml(b.apellido)}</td>
        <td>${formatoCOP(b.monto)}</td>
        <td><span class="badge ${pagada ? 'bg-success' : 'bg-secondary'}">${escapeHtml(b.estado)}</span></td>
        <td>${accion}</td>
      </tr>`;
  }

  async function consultarBonificaciones() {
    if (!campoFecha.value) return Alertas.advertencia('Selecciona la fecha del domingo.');
    try {
      const { bonificaciones = [] } = await peticion(`/bonificaciones?fecha=${encodeURIComponent(campoFecha.value)}`);
      document.getElementById('pagos-bonificaciones').innerHTML = bonificaciones.length === 0
        ? '<tr><td colspan="5" class="text-center py-3 text-muted">No hay bonificaciones para esta fecha.</td></tr>'
        : bonificaciones.map(filaBonificacion).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function pagar(id) {
    const ok = await Alertas.confirmar('Se enviará el pago a la cuenta Nequi del mesero. ¿Continuar?', { confirmar: 'Pagar' });
    if (!ok) return;
    try {
      const respuesta = await peticion(`/pagos/bonificaciones/${encodeURIComponent(id)}`, { metodo: 'POST' });
      Alertas.exito(`${respuesta.mensaje} (${respuesta.pago.cuenta})`);
    } catch (error) {
      Alertas.deError(error);
    }
    consultarBonificaciones();
    cargarSolicitudes();
  }

  async function cargarSolicitudes() {
    try {
      const solicitudes = await peticion('/pagos');
      document.getElementById('pagos-solicitudes').innerHTML = solicitudes.length === 0
        ? '<tr><td colspan="5" class="text-center py-3 text-muted">Aún no hay pagos.</td></tr>'
        : solicitudes.map((s) => `
          <tr>
            <td>${escapeHtml(s.fecha_domingo)}</td>
            <td>${escapeHtml(s.nombre)} ${escapeHtml(s.apellido)}</td>
            <td>${formatoCOP(s.monto)}</td>
            <td><span class="badge ${ESTILO_ESTADO[s.estado] || 'bg-secondary'}">${escapeHtml(s.estado)}</span></td>
            <td class="small text-muted">${escapeHtml(s.mensaje_error || '')}</td>
          </tr>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function cargarMeseros() {
    try {
      const meseros = await peticion('/meseros');
      document.getElementById('cuenta-mesero').innerHTML = meseros
        .map((m) => `<option value="${m.id}">${escapeHtml(m.nombre)} ${escapeHtml(m.apellido)}</option>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function guardarCuenta(evento) {
    evento.preventDefault();
    const meseroId = document.getElementById('cuenta-mesero').value;
    const numero = document.getElementById('cuenta-numero').value.trim();
    try {
      const respuesta = await peticion(`/pagos/cuentas/${encodeURIComponent(meseroId)}`, {
        metodo: 'PUT', cuerpo: { numero_celular: numero }
      });
      Alertas.exito(respuesta.mensaje);
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('btn-pagos-consultar').addEventListener('click', consultarBonificaciones);
  document.getElementById('pagos-bonificaciones').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pagar]');
    if (boton) pagar(boton.dataset.pagar);
  });
  document.getElementById('form-cuenta').addEventListener('submit', guardarCuenta);
  cargarMeseros();
  cargarSolicitudes();
})();

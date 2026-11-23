/* ==========================================================================
   El Huilense · Vista del mesero: notificaciones, turnos, racha, cuenta Nequi
   e historial (mesero-panel.js). El ranking sigue en mesero-ranking.js.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const { peticion, Alertas, Sesion } = window.Huilense;
  const { escapeHtml, formatoCOP } = window.Huilense.Dom;

  const sesion = Sesion.leer();
  if (!sesion || sesion.usuario.rol !== 'MESERO') return; // mesero-ranking.js ya redirige
  const meseroId = sesion.usuario.mesero_id;

  const vacio = (columnas, texto) => `<tr><td colspan="${columnas}" class="vacio">${texto}</td></tr>`;

  async function cargarNotificaciones() {
    const lista = await peticion('/notificaciones');
    const pendientes = lista.filter((n) => Number(n.leida) === 0).length;
    document.getElementById('notif-pendientes').textContent = pendientes ? `${pendientes} nuevas` : '';
    document.getElementById('lista-notificaciones').innerHTML = lista.length === 0
      ? '<li class="vacio">No tienes notificaciones.</li>'
      : lista.map((n) => `
        <li class="${Number(n.leida) === 0 ? 'nueva' : ''}">
          <span class="etiqueta">${escapeHtml(n.tipo)}</span>
          <span>${escapeHtml(n.mensaje)}</span>
          ${Number(n.leida) === 0 ? `<button type="button" class="enlace" data-leer="${n.id}">Marcar leída</button>` : ''}
        </li>`).join('');
  }

  async function cargarTurnosYRacha() {
    const [racha, convocatorias] = await Promise.all([
      peticion(`/racha/${encodeURIComponent(meseroId)}`),
      peticion('/convocatorias/mias')
    ]);
    document.getElementById('mi-racha').textContent = racha.racha_actual;
    document.getElementById('mis-convocatorias').innerHTML = convocatorias.length === 0
      ? vacio(2, 'Aún no tienes convocatorias.')
      : convocatorias.map((c) => `<tr><td>${escapeHtml(c.fecha)}</td><td>${c.estado === 'convocado' ? 'Convocado' : 'Descanso'}</td></tr>`).join('');
  }

  async function cargarCuenta() {
    try {
      const cuenta = await peticion('/pagos/cuenta');
      document.getElementById('cuenta-actual').textContent = cuenta.numero_enmascarado;
    } catch (error) {
      if (error.estado !== 404) throw error; // 404 = todavía no la registra
    }
  }

  async function cargarHistorial() {
    const reporte = await peticion(`/reportes/historial/${encodeURIComponent(meseroId)}`);
    document.getElementById('mi-historial').innerHTML = reporte.filas.length === 0
      ? vacio(4, 'Sin ventas registradas.')
      : reporte.filas.map((f) => `
        <tr>
          <td>${escapeHtml(f.fecha)}</td>
          <td>${formatoCOP(f.total_vendido)}</td>
          <td>${f.posicion ?? '—'}</td>
          <td>${f.bonificacion ? `${formatoCOP(f.bonificacion)} (${escapeHtml(f.estado_bonificacion)})` : '—'}</td>
        </tr>`).join('');
  }

  async function guardarCuenta(evento) {
    evento.preventDefault();
    const numero = document.getElementById('mi-numero-nequi').value.trim();
    try {
      const respuesta = await peticion('/pagos/cuenta', { metodo: 'PUT', cuerpo: { numero_celular: numero } });
      Alertas.exito(respuesta.mensaje);
      document.getElementById('cuenta-actual').textContent = respuesta.cuenta.numero_enmascarado;
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function marcarLeida(id) {
    try {
      await peticion(`/notificaciones/${encodeURIComponent(id)}/leida`, { metodo: 'PATCH' });
      await cargarNotificaciones();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('form-mi-cuenta').addEventListener('submit', guardarCuenta);
  document.getElementById('lista-notificaciones').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-leer]');
    if (boton) marcarLeida(boton.dataset.leer);
  });

  Promise.all([cargarNotificaciones(), cargarTurnosYRacha(), cargarCuenta(), cargarHistorial()])
    .catch((error) => Alertas.deError(error));
});

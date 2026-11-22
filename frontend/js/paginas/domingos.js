/* ==========================================================================
   El Huilense · Página Domingos y cierre de corte (domingos.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'domingos', titulo: 'Domingos y cierre' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;
  const { escapeHtml } = window.Huilense.Dom;

  // Modales Instanciados
  const modalDomingoBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDomingo'));
  const modalCierreBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCierre'));

  // Estado local
  const meserosMap = new Map();

  // 1. Cargar Jornadas Dominicales
  async function cargarJornadas() {
    const tablaCuerpo = document.getElementById('tabla-domingos-cuerpo');

    try {
      const respuesta = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      const domingos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      if (domingos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">Sin jornadas registradas.</td></tr>`;
        return;
      }

      tablaCuerpo.innerHTML = domingos.map(d => `
        <tr>
          <td class="fw-bold text-muted">#${d.id}</td>
          <td class="fw-semibold text-huilense">${escapeHtml(d.fecha)}</td>
          <td><span class="badge bg-huilense-soft text-huilense px-2 py-1">${d.meseros_requeridos} Meseros</span></td>
          <td class="text-end">
            ${Number(d.cerrado) === 1
              ? '<span class="badge bg-secondary-subtle text-secondary px-2 py-1">Cerrado</span>'
              : `<button class="btn btn-sm btn-outline-huilense btn-preparar-cierre py-0 px-2" data-id="${d.id}">Cerrar</button>`}
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
      tablaCuerpo.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
    }
  }

  // 2. Nombres de meseros (id → nombre) para los badges del Top 6
  async function cargarMeseros() {
    try {
      const respuesta = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      const meseros = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
      meseros.forEach((m) => meserosMap.set(m.id, `${m.nombre || ''} ${m.apellido || ''}`.trim()));
    } catch (error) {
      Alertas.error('No se pudo cargar la lista de meseros: ' + error.message);
    }
  }

  // 3. Submit Registrar Domingo
  document.getElementById('form-domingo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('fecha-domingo').value;
    const meseros_requeridos = Number(document.getElementById('meseros-requeridos').value || 0);

    try {
      const respuesta = await peticion('/domingos', { metodo: 'POST', cuerpo: { fecha, meseros_requeridos }, autenticada: true });
      Alertas.exito(respuesta.mensaje || 'Domingo registrado correctamente.');
      e.target.reset();
      modalDomingoBs.hide();
      cargarJornadas();
    } catch (error) {
      Alertas.deError(error);
    }
  });

  // 4. Submit Cierre de Corte
  function mostrarTop6(top6) {
    document.getElementById('resultado-ranking').style.display = 'block';
    document.getElementById('ranking-placeholder').style.display = 'none';

    document.getElementById('lista-ranking-badges').innerHTML = top6.map((mId, index) => `
      <span class="badge bg-huilense text-white fs-6 p-2 rounded-pill shadow-sm">
        #${index + 1} ${escapeHtml(meserosMap.get(mId) || 'Mesero ID: ' + mId)}
      </span>
    `).join('');
  }

  document.getElementById('form-cierre').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domingoId = document.getElementById('cierre-domingo-id').value;

    try {
      const respuesta = await peticion(`/domingos/${domingoId}/cerrar-corte`, { metodo: 'POST', autenticada: true });
      Alertas.exito(respuesta.mensaje || 'Corte dominical cerrado con éxito.');
      modalCierreBs.hide();
      cargarJornadas();
      if (Array.isArray(respuesta.top6)) mostrarTop6(respuesta.top6);
    } catch (error) {
      Alertas.deError(error);
    }
  });

  // Inicialización de datos
  cargarMeseros();
  cargarJornadas();
})();

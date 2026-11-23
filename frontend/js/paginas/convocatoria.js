/* ==========================================================================
   El Huilense · Página Convocatoria «Strategy» y Temporadas (convocatoria.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'convocatoria', titulo: 'Convocatoria' })) return;

  const { peticion, Alertas } = window.Huilense;
  const { escapeHtml } = window.Huilense.Dom;

  const selectDomingo = document.getElementById('conv-domingo');
  const selectEstrategia = document.getElementById('conv-estrategia');

  function filas(lista, vacio) {
    return lista.length === 0
      ? `<tr><td colspan="2" class="text-center py-3 text-muted">${vacio}</td></tr>`
      : lista.map((m, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(m.nombre)} ${escapeHtml(m.apellido)}</td></tr>`).join('');
  }

  function pintar(convocatoria) {
    document.getElementById('conv-convocados').innerHTML = filas(convocatoria.convocados, 'Nadie convocado todavía.');
    document.getElementById('conv-descanso').innerHTML = filas(convocatoria.descanso, 'Nadie en descanso.');
  }

  async function cargarDomingos() {
    try {
      const domingos = (await peticion('/domingos')).filter((d) => Number(d.cerrado) !== 1);
      selectDomingo.innerHTML = domingos.length === 0
        ? '<option value="">No hay domingos abiertos</option>'
        : domingos.map((d) => `<option value="${d.id}">${escapeHtml(d.fecha)} · ${d.meseros_requeridos} meseros</option>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function generar(evento) {
    evento.preventDefault();
    if (!selectDomingo.value) return Alertas.advertencia('Registra primero un domingo abierto.');
    try {
      const respuesta = await peticion('/convocatorias', {
        metodo: 'POST',
        cuerpo: { domingo_id: Number(selectDomingo.value), estrategia: selectEstrategia.value }
      });
      pintar(respuesta.convocatoria);
      Alertas.exito(respuesta.mensaje);
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function consultar() {
    if (!selectDomingo.value) return;
    try {
      pintar(await peticion(`/convocatorias/${encodeURIComponent(selectDomingo.value)}`));
    } catch (error) {
      Alertas.deError(error);
    }
  }

  /* ---------- Temporadas ---------- */
  async function cargarTemporadas() {
    try {
      const temporadas = await peticion('/temporadas');
      document.getElementById('lista-temporadas').innerHTML = temporadas.length === 0
        ? '<li class="list-group-item text-muted">Sin temporadas registradas.</li>'
        : temporadas.map((t) => `<li class="list-group-item">#${t.id} · ${escapeHtml(t.nombre)}</li>`).join('');
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function crearTemporada(evento) {
    evento.preventDefault();
    const campo = document.getElementById('temporada-nombre');
    try {
      const respuesta = await peticion('/temporadas', { metodo: 'POST', cuerpo: { nombre: campo.value } });
      campo.value = '';
      Alertas.exito(respuesta.mensaje);
      cargarTemporadas();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('form-convocatoria').addEventListener('submit', generar);
  document.getElementById('btn-conv-consultar').addEventListener('click', consultar);
  document.getElementById('form-temporada').addEventListener('submit', crearTemporada);
  cargarDomingos();
  cargarTemporadas();
})();

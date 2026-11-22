/* ==========================================================================
   El Huilense · Lógica de Gestión de Meseros (meseros.js)
   ========================================================================== */
(function () {
  'use strict';

  if (!window.Huilense.Layout.iniciar({ pagina: 'meseros', titulo: 'Meseros' })) return;

  const { peticion } = window.Huilense;
  const { Alertas } = window.Huilense;

  // Modales
  const modalNuevoBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoMesero'));
  const modalEditarBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarMesero'));

  let meserosGlobales = [];

  // 1. Cargar Lista de Meseros desde la API
  async function cargarMeseros() {
    const tablaCuerpo = document.getElementById('tabla-meseros-cuerpo');
    try {
      const respuesta = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      meserosGlobales = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      // Actualizar KPIs
      document.getElementById('kpi-total-meseros').textContent = meserosGlobales.length;
      const activos = meserosGlobales.filter(m => m.estado !== 'INACTIVO').length;
      document.getElementById('kpi-activos-meseros').textContent = activos;

      renderizarTabla(meserosGlobales);
    } catch (error) {
      tablaCuerpo.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">No se pudo cargar la lista de meseros.</td></tr>';
      Alertas.deError(error);
    }
  }

  // 2. Renderizar Filas de la Tabla
  function celdaEstado(m) {
    const clase = m.estado === 'INACTIVO' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success';
    return `<td><span class="badge ${clase} rounded-pill px-2 py-1">${m.estado || 'Activo'}</span></td>`;
  }

  function celdaAcciones(m) {
    const inactivo = m.estado === 'INACTIVO';
    const claseToggle = inactivo ? 'btn-outline-success' : 'btn-outline-danger';
    const iconoToggle = inactivo ? 'bi-person-check' : 'bi-person-x';
    return `
      <td class="text-end">
        <button class="btn btn-sm btn-outline-huilense me-1 btn-editar-mesero" data-id="${m.id}" title="Editar">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm ${claseToggle} btn-toggle-estado" data-id="${m.id}" data-estado="${m.estado || 'ACTIVO'}" title="Cambiar Estado">
          <i class="bi ${iconoToggle}"></i>
        </button>
      </td>`;
  }

  function filaMesero(m) {
    return `
      <tr>
        <td class="fw-bold text-muted">#${m.id}</td>
        <td class="fw-semibold text-huilense">${m.nombre || ''} ${m.apellido || ''}</td>
        <td>${m.identificacion || '-'}</td>
        <td class="text-muted small">${m.email || '-'}</td>
        <td>${m.fecha_ingreso || '-'}</td>
        ${celdaEstado(m)}
        ${celdaAcciones(m)}
      </tr>`;
  }

  function renderizarTabla(lista) {
    const tablaCuerpo = document.getElementById('tabla-meseros-cuerpo');
    if (lista.length === 0) {
      tablaCuerpo.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron meseros registrados.</td></tr>`;
      return;
    }
    tablaCuerpo.innerHTML = lista.map(filaMesero).join('');
    vincularAcciones();
  }

  // Binds de acciones
  function vincularAcciones() {
    document.querySelectorAll('.btn-editar-mesero').forEach(btn => btn.addEventListener('click', abrirEdicion));
    document.querySelectorAll('.btn-toggle-estado').forEach(btn => btn.addEventListener('click', cambiarEstado));
  }

  function abrirEdicion(e) {
    const id = Number(e.currentTarget.dataset.id);
    const mesero = meserosGlobales.find(m => m.id === id);
    if (!mesero) return;
    document.getElementById('edit-mesero-id').value = mesero.id;
    document.getElementById('edit-mesero-nombre').value = mesero.nombre || '';
    document.getElementById('edit-mesero-apellido').value = mesero.apellido || '';
    document.getElementById('edit-mesero-identificacion').value = mesero.identificacion || '';
    document.getElementById('edit-mesero-email').value = mesero.email || '';
    modalEditarBs.show();
  }

  function textosConfirmacion(id, desactivar) {
    return desactivar
      ? { texto: `¿Desactivar al mesero #${id}? Su historial se conserva.`, titulo: 'Desactivar mesero', confirmar: 'Desactivar' }
      : { texto: `¿Activar al mesero #${id}?`, titulo: 'Activar mesero', confirmar: 'Activar' };
  }

  async function aplicarEstado(id, nuevoEstado) {
    try {
      await peticion(`/meseros/${id}/estado`, {
        metodo: 'PATCH',
        cuerpo: { estado: nuevoEstado },
        autenticada: true
      });
      Alertas.exito(`Estado del mesero #${id} actualizado correctamente.`);
      cargarMeseros();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  async function cambiarEstado(e) {
    const { id, estado } = e.currentTarget.dataset;
    const desactivar = estado !== 'INACTIVO';
    const { texto, ...opciones } = textosConfirmacion(id, desactivar);
    if (await Alertas.confirmar(texto, opciones)) {
      await aplicarEstado(id, desactivar ? 'INACTIVO' : 'ACTIVO');
    }
  }

  // 3. Búsqueda dinámica en vivo
  document.getElementById('input-buscar-mesero').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtrados = meserosGlobales.filter(m => 
      (m.nombre && m.nombre.toLowerCase().includes(query)) ||
      (m.apellido && m.apellido.toLowerCase().includes(query)) ||
      (m.identificacion && m.identificacion.includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query))
    );
    renderizarTabla(filtrados);
  });

  // 4. Submit Nuevo Mesero
  function leerNuevoMesero() {
    return {
      name: document.getElementById('mesero-name').value.trim(),
      email: document.getElementById('mesero-email').value.trim(),
      password: document.getElementById('mesero-password').value,
      identificacion: document.getElementById('mesero-identificacion').value.trim(),
      nombre: document.getElementById('mesero-nombre').value.trim(),
      apellido: document.getElementById('mesero-apellido').value.trim(),
      fecha_ingreso: document.getElementById('mesero-fecha-ingreso').value
    };
  }

  async function registrarMesero(e) {
    e.preventDefault();
    const cuerpo = leerNuevoMesero();
    try {
      const respuesta = await peticion('/meseros', { metodo: 'POST', cuerpo, autenticada: true });
      Alertas.exito(respuesta.mensaje || 'Mesero registrado exitosamente.');
      e.target.reset();
      modalNuevoBs.hide();
      cargarMeseros();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('form-nuevo-mesero').addEventListener('submit', registrarMesero);

  // 5. Submit Editar Mesero
  function leerEdicionMesero(id) {
    const actual = meserosGlobales.find(x => x.id === Number(id)) || {};
    return {
      name: actual.name,                    // campos que el modal no edita,
      fecha_ingreso: actual.fecha_ingreso,  // pero que el backend exige
      estado: actual.estado,
      nombre: document.getElementById('edit-mesero-nombre').value.trim(),
      apellido: document.getElementById('edit-mesero-apellido').value.trim(),
      identificacion: document.getElementById('edit-mesero-identificacion').value.trim(),
      email: document.getElementById('edit-mesero-email').value.trim()
    };
  }

  async function actualizarMesero(e) {
    e.preventDefault();
    const id = document.getElementById('edit-mesero-id').value;
    const cuerpo = leerEdicionMesero(id);
    try {
      const respuesta = await peticion(`/meseros/${id}`, { metodo: 'PUT', cuerpo, autenticada: true });
      Alertas.exito(respuesta.mensaje || 'Datos actualizados con éxito.');
      modalEditarBs.hide();
      cargarMeseros();
    } catch (error) {
      Alertas.deError(error);
    }
  }

  document.getElementById('form-editar-mesero').addEventListener('submit', actualizarMesero);

  // Carga Inicial
  cargarMeseros();

})();
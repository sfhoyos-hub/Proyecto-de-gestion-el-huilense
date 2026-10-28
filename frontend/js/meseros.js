/* ==========================================================================
   El Huilense · Lógica de Gestión de Meseros (meseros.js)
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, peticion, CONFIG } = window.Huilense;

  // 1. Validar Sesión Activa
  const sesionActual = Sesion.leer();
  if (!sesionActual || sesionActual.usuario.rol !== 'ADMIN') {
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-expirada');
    return;
  }

  // Cargar perfil en la interfaz
  document.getElementById('nombre-admin').textContent = sesionActual.usuario.name || 'Admin';
  const emailElem = document.getElementById('dropdown-admin-email');
  if (emailElem && sesionActual.usuario.email) {
    emailElem.textContent = sesionActual.usuario.email;
    emailElem.title = sesionActual.usuario.email;
  }

  document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
    Sesion.limpiar();
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-cerrada');
  });

  const zonaMensajes = document.getElementById('zona-mensajes');

  function mostrarAlerta(tipo, texto) {
    const clases = { exito: 'alert-success', error: 'alert-danger', info: 'alert-info' };
    zonaMensajes.innerHTML = `
      <div class="alert ${clases[tipo] || 'alert-info'} alert-dismissible fade show shadow-sm rounded-3 mb-4" role="alert">
        <i class="bi ${tipo === 'exito' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2"></i>
        ${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  // Modales
  const modalNuevoBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalNuevoMesero'));
  const modalEditarBs = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarMesero'));

  let meserosGlobales = [];

  // 2. Cargar Lista de Meseros desde la API
  async function cargarMeseros() {
    const tablaCuerpo = document.getElementById('tabla-meseros-cuerpo');
    try {
      const respuesta = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      meserosGlobales = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      // Actualizar KPIs
      document.getElementById('kpi-total-meseros').textContent = meserosGlobales.length;
      const activos = meserosGlobales.filter(m => m.estado !== 'inactivo').length;
      document.getElementById('kpi-activos-meseros').textContent = activos;

      renderizarTabla(meserosGlobales);
    } catch (error) {
      tablaCuerpo.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al cargar meseros: ${error.message}</td></tr>`;
    }
  }

  // 3. Renderizar Filas de la Tabla
  function renderizarTabla(lista) {
    const tablaCuerpo = document.getElementById('tabla-meseros-cuerpo');
    if (lista.length === 0) {
      tablaCuerpo.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron meseros registrados.</td></tr>`;
      return;
    }

    tablaCuerpo.innerHTML = lista.map(m => `
      <tr>
        <td class="fw-bold text-muted">#${m.id}</td>
        <td class="fw-semibold text-huilense">${m.nombre || ''} ${m.apellido || ''}</td>
        <td>${m.identificacion || '-'}</td>
        <td class="text-muted small">${m.email || '-'}</td>
        <td>${m.fecha_ingreso || '-'}</td>
        <td>
          <span class="badge ${m.estado === 'inactivo' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} rounded-pill px-2 py-1">
            ${m.estado || 'Activo'}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-huilense me-1 btn-editar-mesero" data-id="${m.id}" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm ${m.estado === 'inactivo' ? 'btn-outline-success' : 'btn-outline-danger'} btn-toggle-estado" data-id="${m.id}" data-estado="${m.estado || 'activo'}" title="Cambiar Estado">
            <i class="bi ${m.estado === 'inactivo' ? 'bi-person-check' : 'bi-person-x'}"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Binds de acciones
    document.querySelectorAll('.btn-editar-mesero').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.currentTarget.dataset.id);
        const mesero = meserosGlobales.find(m => m.id === id);
        if (mesero) {
          document.getElementById('edit-mesero-id').value = mesero.id;
          document.getElementById('edit-mesero-nombre').value = mesero.nombre || '';
          document.getElementById('edit-mesero-apellido').value = mesero.apellido || '';
          document.getElementById('edit-mesero-identificacion').value = mesero.identificacion || '';
          document.getElementById('edit-mesero-email').value = mesero.email || '';
          modalEditarBs.show();
        }
      });
    });

    document.querySelectorAll('.btn-toggle-estado').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const estadoActual = e.currentTarget.dataset.estado;
        const nuevoEstado = estadoActual === 'inactivo' ? 'activo' : 'inactivo';
        const m = meserosGlobales.find(x => x.id === Number(id));

        try {
          // El PUT del backend exige todos los campos: se reenvían los actuales y solo cambia el estado.
          await peticion(`/meseros/${id}`, {
            metodo: 'PUT',
            cuerpo: {
              name: m.name,
              email: m.email,
              identificacion: m.identificacion,
              nombre: m.nombre,
              apellido: m.apellido,
              fecha_ingreso: m.fecha_ingreso,
              estado: nuevoEstado
            },
            autenticada: true
          });
          mostrarAlerta('exito', `Estado del mesero #${id} actualizado correctamente.`);
          cargarMeseros();
        } catch (error) {
          mostrarAlerta('error', error.message || 'Error al cambiar el estado.');
        }
      });
    });
  }

  // 4. Búsqueda dinámica en vivo
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

  // 5. Submit Nuevo Mesero
  document.getElementById('form-nuevo-mesero').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('mesero-name').value.trim(),
      email: document.getElementById('mesero-email').value.trim(),
      password: document.getElementById('mesero-password').value,
      identificacion: document.getElementById('mesero-identificacion').value.trim(),
      nombre: document.getElementById('mesero-nombre').value.trim(),
      apellido: document.getElementById('mesero-apellido').value.trim(),
      fecha_ingreso: document.getElementById('mesero-fecha-ingreso').value
    };

    try {
      const respuesta = await peticion('/meseros', { metodo: 'POST', cuerpo: payload, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Mesero registrado exitosamente.');
      e.target.reset();
      modalNuevoBs.hide();
      cargarMeseros();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar el mesero.');
    }
  });

  // 6. Submit Editar Mesero
  document.getElementById('form-editar-mesero').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-mesero-id').value;
    const actual = meserosGlobales.find(x => x.id === Number(id)) || {};
    const payload = {
      name: actual.name,                    // campos que el modal no edita,
      fecha_ingreso: actual.fecha_ingreso,  // pero que el backend exige
      estado: actual.estado,
      nombre: document.getElementById('edit-mesero-nombre').value.trim(),
      apellido: document.getElementById('edit-mesero-apellido').value.trim(),
      identificacion: document.getElementById('edit-mesero-identificacion').value.trim(),
      email: document.getElementById('edit-mesero-email').value.trim()
    };

    try {
      const respuesta = await peticion(`/meseros/${id}`, { metodo: 'PUT', cuerpo: payload, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Datos actualizados con éxito.');
      modalEditarBs.hide();
      cargarMeseros();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al actualizar el mesero.');
    }
  });

  // Carga Inicial
  cargarMeseros();

})();
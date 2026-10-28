/* ==========================================================================
   El Huilense · Lógica del Panel de Administración Completo
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, peticion, CONFIG } = window.Huilense;

  const sesionActual = Sesion.leer();
  if (!sesionActual || sesionActual.usuario.rol !== 'ADMIN') {
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-expirada');
    return;
  }

  document.getElementById('nombre-admin').textContent = 'Admin: ' + sesionActual.usuario.name;

  document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
    Sesion.limpiar();
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=sesion-cerrada');
  });

  const zonaMensajes = document.getElementById('zona-mensajes');

  function mostrarAlerta(tipo, texto) {
    const clases = { exito: 'alert-success', error: 'alert-danger', info: 'alert-info' };
    zonaMensajes.innerHTML = `
      <div class="alert ${clases[tipo] || 'alert-info'} alert-dismissible fade show" role="alert">
        ${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  // 1. Cargar listado de Domingos
  async function cargarDomingos() {
    const tbody = document.getElementById('tabla-domingos-cuerpo');
    try {
      const domingos = await peticion('/domingos', { metodo: 'GET', autenticada: true });
      if (!domingos || domingos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted small">No hay domingos registrados.</td></tr>`;
        return;
      }
      tbody.innerHTML = domingos.map(d => `
        <tr>
          <td><strong>${d.id}</strong></td>
          <td>${d.fecha}</td>
          <td><span class="badge bg-success">${d.meseros_requeridos} meseros</span></td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger small">Error al cargar domingos.</td></tr>`;
    }
  }

  // 2. Cargar listado de Meseros
  async function cargarMeseros() {
    const tbody = document.getElementById('tabla-meseros-cuerpo');
    try {
      const meseros = await peticion('/meseros', { metodo: 'GET', autenticada: true });
      if (!meseros || meseros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted small">No hay meseros registrados.</td></tr>`;
        return;
      }
      tbody.innerHTML = meseros.map(m => `
        <tr>
          <td><strong>${m.id}</strong></td>
          <td>${m.identificacion}</td>
          <td>${m.nombre} ${m.apellido}</td>
          <td>${m.email}</td>
          <td><span class="badge ${m.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">${m.estado}</span></td>
        </tr>
      `).join('');
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger small">Error al cargar meseros.</td></tr>`;
    }
  }

  // Registrar Domingo
  document.getElementById('form-domingo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('fecha-domingo').value;
    const meseros_requeridos = Number(document.getElementById('meseros-requeridos').value);

    try {
      const respuesta = await peticion('/domingos', { metodo: 'POST', cuerpo: { fecha, meseros_requeridos }, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Domingo registrado correctamente.');
      e.target.reset();
      cargarDomingos();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar el domingo.');
    }
  });

  // Registrar Venta
  document.getElementById('form-venta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mesero_id = Number(document.getElementById('venta-mesero-id').value);
    const fecha = document.getElementById('venta-fecha').value;
    const total_vendido = Number(document.getElementById('venta-total').value);

    try {
      const respuesta = await peticion('/ventas', { metodo: 'POST', cuerpo: { mesero_id, fecha, total_vendido }, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Venta registrada con éxito.');
      e.target.reset();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar la venta.');
    }
  });

  // Registrar Mesero
  document.getElementById('form-mesero').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cuerpo = {
      name: document.getElementById('mesero-name').value,
      email: document.getElementById('mesero-email').value,
      password: document.getElementById('mesero-password').value,
      identificacion: document.getElementById('mesero-identificacion').value,
      nombre: document.getElementById('mesero-nombre').value,
      apellido: document.getElementById('mesero-apellido').value,
      fecha_ingreso: document.getElementById('mesero-fecha-ingreso').value
    };

    try {
      const respuesta = await peticion('/meseros', { metodo: 'POST', cuerpo, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Mesero registrado correctamente.');
      e.target.reset();
      cargarMeseros(); // Recargar la tabla de meseros
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar el mesero.');
    }
  });

  // Cierre de Corte y Rachas (Top 6)
  document.getElementById('form-cierre').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domingoId = document.getElementById('cierre-domingo-id').value;
    const contenedorRanking = document.getElementById('resultado-ranking');
    const listaBadges = document.getElementById('lista-ranking-badges');

    try {
      const respuesta = await peticion(`/domingos/${domingoId}/cerrar-corte`, { metodo: 'POST', autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Corte dominical cerrado con éxito y rachas actualizadas.');
      
      if (respuesta.top6 && Array.isArray(respuesta.top6)) {
        contenedorRanking.style.display = 'block';
        listaBadges.innerHTML = respuesta.top6.map((idMesero, index) => `
          <span class="badge bg-success fs-6 p-2">
            #${index + 1} - Mesero ID: ${idMesero}
          </span>
        `).join('');
      }
    } catch (error) {
      contenedorRanking.style.display = 'none';
      mostrarAlerta('error', error.message || 'Error al realizar el cierre de corte.');
    }
  });

  // Inicializar tablas al cargar la página
  cargarDomingos();
  cargarMeseros();

})();
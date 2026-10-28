/* ==========================================================================
   El Huilense · Lógica del Panel de Administración (Domingos, Ventas y Rachas)
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, peticion, CONFIG } = window.Huilense;

  // Verificar sesión y rol de administrador
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

  // 1. Registrar Domingo
  document.getElementById('form-domingo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fecha = document.getElementById('fecha-domingo').value;
    const meseros_requeridos = Number(document.getElementById('meseros-requeridos').value);

    try {
      const respuesta = await peticion('/domingos', { metodo: 'POST', cuerpo: { fecha, meseros_requeridos }, autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Domingo registrado correctamente.');
      e.target.reset();
    } catch (error) {
      mostrarAlerta('error', error.message || 'Error al registrar el domingo.');
    }
  });

  // 2. Registrar Venta
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

  // 3. Cierre de Corte y Rachas
  document.getElementById('form-cierre').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domingoId = document.getElementById('cierre-domingo-id').value;
    const contenedorRanking = document.getElementById('resultado-ranking');

    try {
      const respuesta = await peticion(`/domingos/${domingoId}/cerrar-corte`, { metodo: 'POST', autenticada: true });
      mostrarAlerta('exito', respuesta.mensaje || 'Corte dominical cerrado con éxito.');
      
      if (respuesta.top6 && Array.isArray(respuesta.top6)) {
        contenedorRanking.style.display = 'block';
        contenedorRanking.innerHTML = `
          <div class="alert alert-secondary border-success">
            <h5 class="fw-bold text-success mb-2"><i class="bi bi-award-fill"></i> Resultados del Ranking (Top 6 Meseros):</h5>
            <p class="mb-1 small">IDs de meseros clasificados:</p>
            <span class="badge bg-success fs-6">${respuesta.top6.join(', ')}</span>
          </div>
        `;
      }
    } catch (error) {
      contenedorRanking.style.display = 'none';
      mostrarAlerta('error', error.message || 'Error al realizar el cierre de corte.');
    }
  });

})();
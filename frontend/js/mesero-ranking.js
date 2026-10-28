document.addEventListener('DOMContentLoaded', () => {
  // Verificación de acceso
  const rol = window.Huilense.getRol();
  if (!rol || rol !== 'MESERO') {
    window.Huilense.cerrarSesion();
    return;
  }

  cargarDatosPerfil();

  const inputFecha = document.getElementById('fecha-ranking');
  const btnBuscar = document.getElementById('btn-buscar');
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  const contenedorResultado = document.getElementById('resultado-ranking');
  const mensajeEstado = document.getElementById('mensaje-estado');

  const resPosicion = document.getElementById('res-posicion');
  const resBadgeTop = document.getElementById('res-badge-top');
  const resTotal = document.getElementById('res-total');

  // Asignar fecha actual por defecto
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.value = hoy;

  btnCerrarSesion.addEventListener('click', () => {
    window.Huilense.cerrarSesion();
  });

  btnBuscar.addEventListener('click', async () => {
    ocultarMensajes();
    const fecha = inputFecha.value;

    if (!fecha) {
      mostrarMensaje('Por favor seleccione una fecha válida.', 'error');
      return;
    }

    try {
      const data = await window.Huilense.obtenerRankingMiPuesto(fecha);

      resPosicion.textContent = `#${data.posicion}`;
      resTotal.textContent = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(data.total_vendido || 0);

      if (data.top6 === 1) {
        resBadgeTop.textContent = 'Pertenece al Top 6';
        resBadgeTop.className = 'badge badge--top-si';
      } else {
        resBadgeTop.textContent = 'Fuera del Top 6';
        resBadgeTop.className = 'badge badge--top-no';
      }

      contenedorResultado.style.display = 'grid';
    } catch (error) {
      contenedorResultado.style.display = 'none';

      if (error.status === 404) {
        mostrarMensaje(error.message || 'No hay puesto registrado para la fecha seleccionada.', 'info');
      } else if (error.status === 400) {
        mostrarMensaje(error.message || 'Formato de fecha no válido.', 'error');
      } else {
        mostrarMensaje(error.message || 'Error de conexión con el servidor.', 'error');
      }
    }
  });

  async function cargarDatosPerfil() {
    try {
      const usuarioRaw = localStorage.getItem('huilense_usuario');
      if (!usuarioRaw) return;
      const usuario = JSON.parse(usuarioRaw);

      // El login solo devuelve name y mesero_id: nombre e identificación salen de GET /meseros/:id
      let datos = usuario;
      if (usuario.mesero_id) {
        datos = await window.Huilense.peticion(`/meseros/${usuario.mesero_id}`, { metodo: 'GET' });
      }
      document.getElementById('perf-nombre').textContent = `${datos.nombre || ''} ${datos.apellido || ''}`.trim() || usuario.name || 'No asignado';
      document.getElementById('perf-identificacion').textContent = datos.identificacion || 'N/A';
      document.getElementById('perf-rol').textContent = usuario.rol || 'MESERO';
    } catch (e) {
      console.error('Error al cargar perfil:', e);
    }
  }

  function mostrarMensaje(texto, tipo) {
    mensajeEstado.textContent = texto;
    mensajeEstado.className = `mensaje ${tipo === 'error' ? 'mensaje--error' : 'mensaje--info'}`;
    mensajeEstado.style.display = 'block';
  }

  function ocultarMensajes() {
    mensajeEstado.style.display = 'none';
    mensajeEstado.textContent = '';
  }
});
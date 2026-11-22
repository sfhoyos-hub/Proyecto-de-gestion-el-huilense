document.addEventListener('DOMContentLoaded', () => {
  const { Alertas } = window.Huilense;

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

  const resPosicion = document.getElementById('res-posicion');
  const resBadgeTop = document.getElementById('res-badge-top');
  const resTotal = document.getElementById('res-total');

  // Asignar fecha actual por defecto
  const hoy = new Date().toISOString().split('T')[0];
  inputFecha.value = hoy;

  btnCerrarSesion.addEventListener('click', () => {
    window.Huilense.cerrarSesion();
  });

  function pintarResultado(data) {
    resPosicion.textContent = `#${data.posicion}`;
    resTotal.textContent = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(data.total_vendido || 0);

    const esTop = data.top6 === 1;
    resBadgeTop.textContent = esTop ? 'Pertenece al Top 6' : 'Fuera del Top 6';
    resBadgeTop.className = esTop ? 'badge badge--top-si' : 'badge badge--top-no';
    contenedorResultado.style.display = 'grid';
  }

  function manejarErrorConsulta(error) {
    contenedorResultado.style.display = 'none';
    if (error.status === 404) {
      Alertas.info(error.message || 'No hay puesto registrado para la fecha seleccionada.');
      return;
    }
    Alertas.deError(error);
  }

  async function consultarPuesto() {
    const fecha = inputFecha.value;
    if (!fecha) {
      Alertas.advertencia('Por favor seleccione una fecha válida.');
      return;
    }
    try {
      pintarResultado(await window.Huilense.obtenerRankingMiPuesto(fecha));
    } catch (error) {
      manejarErrorConsulta(error);
    }
  }

  btnBuscar.addEventListener('click', consultarPuesto);

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
});
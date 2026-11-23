/* ==========================================================================
   El Huilense · Header y menú lateral compartidos del panel admin (layout.js)
   Uso: if (!window.Huilense.Layout.iniciar({ pagina: 'ventas', titulo: 'Ventas' })) return;
   ========================================================================== */
(function () {
  'use strict';

  const { Sesion, CONFIG } = window.Huilense;
  const { escapeHtml } = window.Huilense.Dom;

  // Enlaces del menú lateral; "pagina" es el nombre que cada página pasa a iniciar()
  const ENLACES = [
    { pagina: 'dashboard', href: 'dashboard.html', icono: 'bi-speedometer2', texto: 'Dashboard' },
    { pagina: 'meseros', href: 'meseros.html', icono: 'bi-people-fill', texto: 'Meseros' },
    { pagina: 'domingos', href: 'domingos.html', icono: 'bi-calendar3', texto: 'Domingos y cierre' },
    { pagina: 'ventas', href: 'ventas.html', icono: 'bi-receipt', texto: 'Ventas' },
    { pagina: 'ranking', href: 'ranking.html', icono: 'bi-trophy-fill', texto: 'Ranking' },
    { pagina: 'bonificaciones', href: 'bonificaciones.html', icono: 'bi-cash-coin', texto: 'Bonificaciones' },
    { pagina: 'convocatoria', href: 'convocatoria.html', icono: 'bi-person-check-fill', texto: 'Convocatoria' },
    { pagina: 'pagos', href: 'pagos.html', icono: 'bi-phone-fill', texto: 'Pagos Nequi' },
    { pagina: 'reportes', href: 'reportes.html', icono: 'bi-bar-chart-fill', texto: 'Reportes' },
    { pagina: 'sugerencias', href: 'sugerencias.html', icono: 'bi-chat-left-text-fill', texto: 'Sugerencias' }
  ];

  function redirigirALogin(motivo) {
    window.location.replace(CONFIG.PAGINA_LOGIN + '?motivo=' + motivo);
  }

  function cerrarSesion() {
    Sesion.limpiar();
    redirigirALogin('sesion-cerrada');
  }

  // Devuelve la sesión si es de un ADMIN; si no, redirige al login y devuelve null.
  function validarSesionAdmin() {
    const sesion = Sesion.leer();
    if (!sesion || sesion.usuario.rol !== 'ADMIN') {
      redirigirALogin('sesion-expirada');
      return null;
    }
    return sesion;
  }

  /* ---------- Header ---------- */
  function crearBarraSuperior(titulo) {
    const barra = document.createElement('div');
    barra.className = 'd-flex align-items-center justify-content-between flex-wrap gap-3';
    barra.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-light btn-sm d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarUnity" aria-label="Abrir menú">
          <i class="bi bi-list fs-5"></i>
        </button>
        <a class="navbar-brand font-serif fw-bold fs-3 text-white d-flex align-items-center mb-0" href="dashboard.html">
          <i class="fa-solid fa-utensils text-gold me-2"></i>
          <span>El Huilense</span>
        </a>
        <nav class="d-none d-md-block ms-3" aria-label="breadcrumb">
          <ol class="breadcrumb mb-0 text-white-50 small">
            <li class="breadcrumb-item"><a href="dashboard.html" class="text-white-50 text-decoration-none"><i class="bi bi-house-door me-1"></i>Inicio</a></li>
            <li class="breadcrumb-item text-white active" aria-current="page">${escapeHtml(titulo)}</li>
          </ol>
        </nav>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="header-badge d-none d-sm-flex align-items-center px-3 py-1.5 rounded-pill bg-white-10">
          <span class="live-dot me-2"></span>
          <span class="small fw-semibold">Sistema en vivo</span>
        </div>
        <button id="btn-cerrar-sesion" class="btn btn-outline-gold btn-sm rounded-pill px-3">
          <i class="bi bi-box-arrow-right me-1"></i> Salir
        </button>
      </div>`;
    barra.querySelector('#btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    return barra;
  }

  // Conserva lo que la página haya puesto dentro del <header> (sus tarjetas KPI) debajo de la barra.
  function pintarCabecera(titulo) {
    const cabecera = document.getElementById('layout-cabecera');
    const contenido = document.createElement('div');
    contenido.className = 'container-fluid px-4 py-3';
    contenido.append(crearBarraSuperior(titulo), ...cabecera.childNodes);
    cabecera.className = 'unity-header text-white pb-5';
    cabecera.replaceChildren(contenido);
  }

  /* ---------- Menú lateral ---------- */
  function htmlEnlace(enlace, paginaActiva) {
    const activo = enlace.pagina === paginaActiva;
    return `
      <li class="nav-item">
        <a href="${enlace.href}" class="nav-link unity-link${activo ? ' active' : ''}"${activo ? ' aria-current="page"' : ''}>
          <i class="bi ${enlace.icono} me-2"></i> ${escapeHtml(enlace.texto)}
        </a>
      </li>`;
  }

  function htmlSidebar(paginaActiva) {
    return `
      <div class="unity-sidebar bg-white p-4 rounded-4 shadow-sm border-0 offcanvas-lg offcanvas-start" id="sidebarUnity">
        <div class="text-center pb-4 border-bottom mb-4 profile-card-container">
          <div class="avatar-box mx-auto mb-3 shadow-sm">
            <i class="bi bi-person-circle fs-1 text-huilense"></i>
          </div>
          <h6 class="fw-bold text-dark mb-1 text-truncate" id="layout-nombre"></h6>
          <small class="text-muted d-block mb-2 text-truncate user-email-text" id="layout-email"></small>
          <span class="badge bg-huilense-soft text-huilense rounded-pill px-3 py-1">Administrador</span>
        </div>
        <div class="sidebar-menu">
          <small class="text-uppercase text-muted fw-bold extra-small tracking-wider mb-2 d-block">Navegación</small>
          <ul class="nav flex-column gap-2 mb-4">
            ${ENLACES.map((enlace) => htmlEnlace(enlace, paginaActiva)).join('')}
          </ul>
        </div>
      </div>`;
  }

  function pintarSidebar(paginaActiva, usuario) {
    const sidebar = document.getElementById('layout-sidebar');
    sidebar.className = 'col-lg-3 col-xl-2';
    sidebar.innerHTML = htmlSidebar(paginaActiva);

    const email = usuario.email || '';
    sidebar.querySelector('#layout-nombre').textContent = usuario.name || 'Admin';
    sidebar.querySelector('#layout-email').textContent = email;
    sidebar.querySelector('#layout-email').title = email;
  }

  /* ---------- API pública ---------- */
  function iniciar({ pagina, titulo }) {
    const sesion = validarSesionAdmin();
    if (!sesion) return false;

    pintarCabecera(titulo);
    pintarSidebar(pagina, sesion.usuario);
    return true;
  }

  window.Huilense.Layout = { iniciar };
})();

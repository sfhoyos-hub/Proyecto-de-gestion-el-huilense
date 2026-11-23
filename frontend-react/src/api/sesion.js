// Guarda la sesión con las mismas claves que las páginas anteriores
// (frontend/js/api.js), para que ranking y bonificaciones sigan funcionando.
const CLAVE_TOKEN = 'huilense_token';
const CLAVE_ROL = 'huilense_rol';
const CLAVE_USUARIO = 'huilense_usuario';

export function leerSesion() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO));
    return token && usuario?.rol ? { token, usuario } : null;
  } catch {
    return null;
  }
}

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_ROL, usuario.rol);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_ROL);
  localStorage.removeItem(CLAVE_USUARIO);
}

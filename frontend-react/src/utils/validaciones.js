// Reglas de validación del lado del cliente. El backend vuelve a validar todo.
export const MIN_CORREO = 8;
export const MIN_PASSWORD = 8;

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function esCorreoValido(valor) {
  return FORMATO_CORREO.test(valor.trim());
}

// Fecha YYYY-MM-DD real del calendario (se evalúa en UTC, igual que el backend).
export function esFechaValida(fecha) {
  if (!FORMATO_FECHA.test(fecha || '')) return false;
  const dia = new Date(`${fecha}T00:00:00.000Z`);
  return !Number.isNaN(dia.getTime()) && dia.toISOString().slice(0, 10) === fecha;
}

export function esDomingo(fecha) {
  return esFechaValida(fecha) && new Date(`${fecha}T00:00:00.000Z`).getUTCDay() === 0;
}

// Reglas reutilizables para useFormulario: cada una devuelve un mensaje o ''.
export const reglas = {
  obligatorio: (etiqueta) => (valor) =>
    String(valor ?? '').trim() ? '' : `Completa ${etiqueta.charAt(0).toLowerCase()}${etiqueta.slice(1)}.`,
  seleccion: (etiqueta) => (valor) =>
    String(valor ?? '').trim() ? '' : `Selecciona ${etiqueta.charAt(0).toLowerCase()}${etiqueta.slice(1)}.`,
  minimo: (etiqueta, cantidad) => (valor) =>
    String(valor ?? '').trim().length >= cantidad ? '' : `${etiqueta} debe tener al menos ${cantidad} caracteres.`,
  correo: () => (valor) =>
    esCorreoValido(String(valor ?? '')) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.',
  domingo: () => (valor) =>
    esDomingo(valor) ? '' : 'La fecha debe ser un domingo.',
  enteroPositivo: (etiqueta) => (valor) =>
    Number.isInteger(Number(valor)) && Number(valor) > 0 ? '' : `${etiqueta} debe ser un número entero mayor a 0.`,
  passwordOpcional: (cantidad) => (valor) =>
    !valor || String(valor).length >= cantidad ? '' : `La nueva contraseña debe tener al menos ${cantidad} caracteres.`,
  fechaNoFutura: (etiqueta) => (valor) =>
    esFechaValida(valor) && valor <= new Date().toISOString().slice(0, 10) ? '' : `${etiqueta} debe ser una fecha válida que no esté en el futuro.`,
  montoValido: (etiqueta) => (valor) =>
    String(valor ?? '').trim() !== '' && Number(valor) >= 0 ? '' : `${etiqueta} debe ser un valor igual o mayor a 0.`
};

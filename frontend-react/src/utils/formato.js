const PESOS = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatearPesos(valor) {
  return PESOS.format(Number(valor) || 0);
}

// "2026-11-22" -> "domingo, 22 de noviembre de 2026"
export function formatearFechaLarga(fecha) {
  if (!fecha) return '—';
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function nombreCompleto(persona) {
  return `${persona?.nombre || ''} ${persona?.apellido || ''}`.trim() || 'Sin nombre';
}

// "2026-11-22" -> "22 nov 2026"
export function formatearFechaCorta(fecha) {
  if (!fecha) return '—';
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

import { LoaderCircle } from 'lucide-react';

const VARIANTES = {
  primario: 'bg-huilense-600 text-white hover:bg-huilense-800 focus-visible:outline-huilense-600',
  secundario: 'bg-white text-huilense-700 border border-borde hover:bg-huilense-50 focus-visible:outline-huilense-600',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  oro: 'bg-oro text-huilense-800 hover:brightness-95 focus-visible:outline-oro'
};

const TAMANOS = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
};

// Botón reutilizable. Props: variante, tamano, icono (componente de lucide),
// cargando, anchoCompleto y cualquier prop nativa de <button> (onClick, type...).
export default function Boton({
  children,
  variante = 'primario',
  tamano = 'md',
  icono: Icono,
  cargando = false,
  anchoCompleto = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
        focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTES[variante]} ${TAMANOS[tamano]} ${anchoCompleto ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {cargando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        : Icono && <Icono className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

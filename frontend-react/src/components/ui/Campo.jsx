import { useId } from 'react';

// Campo de formulario reutilizable con etiqueta, ayuda y mensaje de error.
// Props: etiqueta, error, ayuda, como ('input' | 'select'), icono y las props
// nativas del control (name, type, value, onChange, minLength...).
export default function Campo({ etiqueta, error, ayuda, como = 'input', icono: Icono, children, className = '', ...props }) {
  const id = useId();
  const idMensaje = `${id}-mensaje`;
  const Control = como;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-texto">
        {etiqueta}
      </label>
      <div className="relative">
        {Icono && (
          <Icono className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        )}
        <Control
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error || ayuda ? idMensaje : undefined}
          className={`w-full rounded-xl border bg-white py-2.5 text-sm text-texto shadow-sm transition
            placeholder:text-slate-400 focus:outline-none focus:ring-2
            ${Icono ? 'pl-9 pr-3' : 'px-3'}
            ${error ? 'border-red-400 focus:ring-red-200' : 'border-borde focus:border-huilense-600 focus:ring-huilense-100'}`}
          {...props}
        >
          {children}
        </Control>
      </div>
      {(error || ayuda) && (
        <p id={idMensaje} className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {error || ayuda}
        </p>
      )}
    </div>
  );
}

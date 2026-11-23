import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const ANCHOS = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

// Ventana modal reutilizable que aparece al frente con fondo oscuro.
// Props: abierto, titulo, onCerrar, ancho, pie (botones) y children (contenido).
export default function Modal({ abierto, titulo, onCerrar, ancho = 'md', pie, children }) {
  const ventana = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  // Solo al abrir: enfoca el primer campo y permite cerrar con la tecla Escape.
  useEffect(() => {
    if (!abierto) return undefined;

    const alPresionarTecla = (evento) => {
      // Si hay una alerta encima, Escape cierra solo la alerta.
      if (evento.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) cerrar.current?.();
    };

    document.addEventListener('keydown', alPresionarTecla);
    ventana.current?.querySelector('input, select, button:not([data-cerrar])')?.focus();
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        ref={ventana}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`animar-aparicion w-full ${ANCHOS[ancho]} rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-borde px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-huilense-700">{titulo}</h2>
          {onCerrar && (
            <button type="button" data-cerrar onClick={onCerrar} aria-label="Cerrar"
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-borde px-6 py-4">{pie}</div>}
      </div>
    </div>
  );
}

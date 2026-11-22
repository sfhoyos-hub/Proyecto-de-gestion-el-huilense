import { CircleCheck, CircleX, TriangleAlert, CircleHelp } from 'lucide-react';
import Boton from './Boton';

const TIPOS = {
  exito: { Icono: CircleCheck, color: 'text-emerald-600 bg-emerald-50', titulo: 'Operación exitosa' },
  error: { Icono: CircleX, color: 'text-red-600 bg-red-50', titulo: 'No se pudo completar' },
  advertencia: { Icono: TriangleAlert, color: 'text-amber-600 bg-amber-50', titulo: 'Revisa los datos' },
  confirmar: { Icono: CircleHelp, color: 'text-huilense-600 bg-huilense-50', titulo: '¿Estás seguro?' }
};

// Ventanita pequeña al frente para mensajes de éxito, error, advertencia o confirmación.
// Props: alerta ({ tipo, mensaje, titulo, textoConfirmar, peligro }) y onResponder(boolean).
export default function ModalAlerta({ alerta, onResponder }) {
  if (!alerta) return null;

  const { Icono, color, titulo } = TIPOS[alerta.tipo];
  const mensajes = Array.isArray(alerta.mensaje) ? alerta.mensaje : [alerta.mensaje];
  const esConfirmacion = alerta.tipo === 'confirmar';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      onKeyDown={(e) => e.key === 'Escape' && onResponder(false)}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="alerta-titulo" aria-describedby="alerta-mensaje"
        className="animar-aparicion w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${color}`}>
          <Icono className="size-8" aria-hidden="true" />
        </div>
        <h2 id="alerta-titulo" className="mt-4 font-serif text-lg font-bold text-texto">{alerta.titulo || titulo}</h2>
        <div id="alerta-mensaje" className="mt-2 space-y-1 text-sm text-slate-600">
          {mensajes.map((texto) => <p key={texto}>{texto}</p>)}
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {esConfirmacion && (
            <Boton variante="secundario" onClick={() => onResponder(false)}>Cancelar</Boton>
          )}
          <Boton autoFocus variante={alerta.peligro ? 'peligro' : 'primario'} onClick={() => onResponder(true)}>
            {esConfirmacion ? alerta.textoConfirmar || 'Confirmar' : 'Aceptar'}
          </Boton>
        </div>
      </div>
    </div>
  );
}

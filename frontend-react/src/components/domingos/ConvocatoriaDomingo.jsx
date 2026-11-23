import { useState } from 'react';
import { Coffee, RefreshCw, UserCheck } from 'lucide-react';
import Boton from '../ui/Boton';
import Campo from '../ui/Campo';
import Cargando from '../ui/Cargando';
import Insignia from '../ui/Insignia';
import Modal from '../ui/Modal';
import useAlertas from '../../hooks/useAlertas';
import useConvocatoria, { ESTRATEGIAS } from '../../hooks/useConvocatoria';
import { formatearFechaLarga, nombreCompleto } from '../../utils/formato';

// Lista de meseros de una columna (convocados o en descanso).
function ListaMeseros({ titulo, icono: Icono, meseros, tono, vacio }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-texto">
        <Icono className="size-4 text-huilense-600" aria-hidden="true" />
        {titulo} <Insignia tono={tono}>{meseros.length}</Insignia>
      </h3>
      {meseros.length === 0
        ? <p className="text-sm text-slate-500">{vacio}</p>
        : (
          <ol className="divide-y divide-borde rounded-xl border border-borde">
            {meseros.map((m, i) => (
              <li key={m.mesero_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium text-texto">{i + 1}. {nombreCompleto(m)}</span>
                {m.identificacion && <span className="text-xs text-slate-500">{m.identificacion}</span>}
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}

// Ventana con los meseros convocados y en descanso de un domingo.
// Si el domingo sigue abierto, permite volver a convocar con otro criterio.
// Props: domingo (o null para cerrar), onCerrar, onCambio (para recargar la lista de domingos).
export default function ConvocatoriaDomingo({ domingo, onCerrar, onCambio }) {
  const { convocados, descanso, tieneConvocatoria, cargando, generar } = useConvocatoria(domingo?.id ?? null);
  const { exito, error, confirmar } = useAlertas();
  const [estrategia, setEstrategia] = useState('rendimiento');
  const [generando, setGenerando] = useState(false);
  const abierto = Number(domingo?.cerrado) !== 1;

  const convocar = async () => {
    if (tieneConvocatoria) {
      const acepta = await confirmar(
        ['Se reemplazará la lista actual de meseros convocados para este domingo.', 'Los nuevos convocados recibirán una notificación.'],
        { titulo: '¿Volver a convocar?', textoConfirmar: 'Convocar de nuevo' });
      if (!acepta) return;
    }

    setGenerando(true);
    try {
      const respuesta = await generar(estrategia);
      onCambio?.();
      exito(respuesta?.mensaje || 'Convocatoria generada correctamente.');
    } catch (problema) {
      error(problema);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Modal abierto={Boolean(domingo)} onCerrar={onCerrar} ancho="lg" titulo="Meseros del domingo"
      pie={<Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>}>
      {domingo && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            <span className="font-semibold capitalize text-huilense-700">{formatearFechaLarga(domingo.fecha)}</span>
            {' · '}se requieren {domingo.meseros_requeridos} meseros.
          </p>

          {cargando
            ? <Cargando texto="Cargando meseros…" />
            : (
              <div className="grid gap-5 sm:grid-cols-2">
                <ListaMeseros titulo="Convocados" icono={UserCheck} meseros={convocados} tono="exito"
                  vacio="Este domingo aún no tiene meseros convocados." />
                <ListaMeseros titulo="En descanso" icono={Coffee} meseros={descanso} tono="neutro"
                  vacio="Nadie queda en descanso." />
              </div>
            )}

          {abierto && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-huilense-50 p-4">
              <Campo como="select" etiqueta="Criterio para convocar" value={estrategia}
                onChange={(e) => setEstrategia(e.target.value)} className="min-w-64 flex-1">
                {ESTRATEGIAS.map((e) => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
              </Campo>
              <Boton icono={RefreshCw} cargando={generando} onClick={convocar}>
                {tieneConvocatoria ? 'Convocar de nuevo' : 'Convocar meseros'}
              </Boton>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

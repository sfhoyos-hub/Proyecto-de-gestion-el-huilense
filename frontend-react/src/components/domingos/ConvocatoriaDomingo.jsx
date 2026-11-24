import { useEffect, useState } from 'react';
import { Coffee, RefreshCw, UserCheck } from 'lucide-react';
import Boton from '../ui/Boton';
import Campo from '../ui/Campo';
import Cargando from '../ui/Cargando';
import Insignia from '../ui/Insignia';
import Modal from '../ui/Modal';
import useAlertas from '../../hooks/useAlertas';
import useConvocatoria, { ESTRATEGIAS } from '../../hooks/useConvocatoria';
import { formatearFechaCorta, formatearFechaLarga, formatearPesos, nombreCompleto } from '../../utils/formato';

const TEXTO_CRITERIO = {
  rendimiento: 'Por rendimiento: primero quien más vendió en los últimos domingos cerrados.',
  antiguedad: 'Por antigüedad: primero quien tiene la fecha de ingreso más antigua.'
};

// Muestra los dos datos del mesero y resalta el que usó el criterio.
function DatosMesero({ mesero, estrategia }) {
  const resaltar = (criterio) => (estrategia === criterio ? 'font-semibold text-huilense-700' : 'text-slate-500');
  return (
    <span className="flex flex-col items-end text-xs">
      <span className={resaltar('rendimiento')}>{formatearPesos(mesero.total_reciente)} vendidos</span>
      <span className={resaltar('antiguedad')}>Ingresó {formatearFechaCorta(mesero.fecha_ingreso)}</span>
    </span>
  );
}

// Lista de meseros de una columna (convocados o en descanso), en el orden de la convocatoria.
function ListaMeseros({ titulo, icono: Icono, meseros, tono, vacio, estrategia }) {
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
                <span className="font-medium text-texto">{m.orden ?? i + 1}. {nombreCompleto(m)}</span>
                <DatosMesero mesero={m} estrategia={estrategia} />
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
  const { convocados, descanso, estrategia: criterioActual, domingosConsiderados, nota, tieneConvocatoria, cargando, generar } =
    useConvocatoria(domingo?.id ?? null);
  const { exito, error, confirmar } = useAlertas();
  const [estrategia, setEstrategia] = useState('rendimiento');
  const [generando, setGenerando] = useState(false);
  const abierto = Number(domingo?.cerrado) !== 1;

  // Al abrir la ventana, el selector muestra el criterio con que se convocó.
  useEffect(() => {
    if (criterioActual) setEstrategia(criterioActual);
  }, [criterioActual]);

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

          {!cargando && criterioActual && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-semibold text-huilense-700">Criterio usado.</span> {TEXTO_CRITERIO[criterioActual]}
                {' '}Las ventas cuentan los últimos {domingosConsiderados} domingo(s) cerrado(s) antes de esta fecha.
              </p>
              {nota && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{nota}</p>}
            </div>
          )}

          {cargando
            ? <Cargando texto="Cargando meseros…" />
            : (
              <div className="grid gap-5 sm:grid-cols-2">
                <ListaMeseros titulo="Convocados" icono={UserCheck} meseros={convocados} tono="exito" estrategia={criterioActual}
                  vacio="Este domingo aún no tiene meseros convocados." />
                <ListaMeseros titulo="En descanso" icono={Coffee} meseros={descanso} tono="neutro" estrategia={criterioActual}
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

import { useMemo, useState } from 'react';
import { CalendarCheck, CalendarDays, CalendarPlus, Lock, LockOpen, Users } from 'lucide-react';
import ConvocatoriaDomingo from '../components/domingos/ConvocatoriaDomingo';
import FormularioDomingo from '../components/domingos/FormularioDomingo';
import Boton from '../components/ui/Boton';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import Insignia from '../components/ui/Insignia';
import Tabla from '../components/ui/Tabla';
import TarjetaKpi from '../components/ui/TarjetaKpi';
import useAlertas from '../hooks/useAlertas';
import useDomingos from '../hooks/useDomingos';
import useMeseros from '../hooks/useMeseros';
import { formatearFechaLarga, nombreCompleto } from '../utils/formato';

export default function DomingosPage() {
  const { domingos, abiertos, cargando, error: errorCarga, recargar, registrar, cerrarCorte } = useDomingos();
  const { meseros } = useMeseros();
  const { exito, error, confirmar } = useAlertas();
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [domingoConvocatoria, setDomingoConvocatoria] = useState(null);

  const nombres = useMemo(() => new Map(meseros.map((m) => [m.id, nombreCompleto(m)])), [meseros]);

  const cerrar = async (domingo) => {
    const acepta = await confirmar(
      [`Se cerrará el corte del ${formatearFechaLarga(domingo.fecha)}.`, 'Se calculará el ranking y ya no se podrán registrar ni editar ventas de ese día.'],
      { titulo: '¿Cerrar corte dominical?', textoConfirmar: 'Cerrar corte', peligro: true });
    if (!acepta) return;

    try {
      const respuesta = await cerrarCorte(domingo.id);
      const top6 = Array.isArray(respuesta?.top6) ? respuesta.top6 : [];
      exito([
        respuesta?.mensaje || 'Corte cerrado correctamente.',
        ...top6.map((id, i) => `#${i + 1} ${nombres.get(id) || `Mesero ${id}`}`)
      ], { titulo: top6.length ? 'Corte cerrado · Top 6' : 'Corte cerrado' });
    } catch (problema) {
      error(problema);
    }
  };

  const columnas = [
    { titulo: 'ID', render: (d) => <span className="font-semibold text-slate-500">#{d.id}</span> },
    { titulo: 'Fecha', render: (d) => <span className="font-semibold capitalize text-huilense-700">{formatearFechaLarga(d.fecha)}</span> },
    { titulo: 'Meseros requeridos', campo: 'meseros_requeridos' },
    {
      titulo: 'Convocados', render: (d) => {
        const convocados = Number(d.convocados) || 0;
        if (convocados === 0) return <Insignia>Sin convocar</Insignia>;
        return <Insignia tono={convocados >= d.meseros_requeridos ? 'exito' : 'marca'}>{convocados} de {d.meseros_requeridos}</Insignia>;
      }
    },
    { titulo: 'Estado', render: (d) => (Number(d.cerrado) === 1 ? <Insignia>Cerrado</Insignia> : <Insignia tono="exito">Abierto</Insignia>) },
    {
      titulo: 'Acción', alinear: 'right', render: (d) => (
        <div className="flex justify-end gap-2">
          <Boton tamano="sm" variante="secundario" icono={Users} onClick={() => setDomingoConvocatoria(d)}>Ver meseros</Boton>
          {Number(d.cerrado) === 1
            ? <span className="self-center text-xs text-slate-400">Corte cerrado</span>
            : <Boton tamano="sm" variante="secundario" icono={Lock} onClick={() => cerrar(d)}>Cerrar corte</Boton>}
        </div>
      )
    }
  ];

  return (
    <>
      <EncabezadoPagina titulo="Domingos" descripcion="Programa las jornadas dominicales, revisa qué meseros quedaron convocados y cierra el corte para calcular el Top 6."
        acciones={<Boton icono={CalendarPlus} onClick={() => setFormularioAbierto(true)}>Registrar domingo</Boton>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaKpi titulo="Domingos registrados" valor={domingos.length} icono={CalendarDays} />
        <TarjetaKpi titulo="Abiertos" valor={abiertos.length} detalle="Aceptan ventas" icono={LockOpen} />
        <TarjetaKpi titulo="Cerrados" valor={domingos.length - abiertos.length} detalle="Con ranking calculado" icono={CalendarCheck} />
      </div>

      <Tabla columnas={columnas} filas={domingos} cargando={cargando}
        mensajeVacio={errorCarga ? `No se pudo cargar la lista: ${errorCarga.message}` : 'Aún no hay domingos registrados.'} />

      <FormularioDomingo abierto={formularioAbierto} onGuardar={registrar} onCerrar={() => setFormularioAbierto(false)} />
      <ConvocatoriaDomingo domingo={domingoConvocatoria} onCambio={recargar} onCerrar={() => setDomingoConvocatoria(null)} />
    </>
  );
}

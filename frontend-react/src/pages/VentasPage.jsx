import { useEffect, useState } from 'react';
import { CalendarDays, Pencil, Plus, Receipt, Wallet } from 'lucide-react';
import FormularioVenta from '../components/ventas/FormularioVenta';
import Boton from '../components/ui/Boton';
import Campo from '../components/ui/Campo';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import Insignia from '../components/ui/Insignia';
import Tabla from '../components/ui/Tabla';
import TarjetaKpi from '../components/ui/TarjetaKpi';
import useAlertas from '../hooks/useAlertas';
import useDomingos from '../hooks/useDomingos';
import useMeseros from '../hooks/useMeseros';
import useVentas from '../hooks/useVentas';
import { formatearFechaLarga, formatearPesos, nombreCompleto } from '../utils/formato';

export default function VentasPage() {
  const { domingos, abiertos } = useDomingos();
  const { activos } = useMeseros();
  const { advertencia } = useAlertas();
  const [fecha, setFecha] = useState('');
  const { ventas, total, cargando, error: errorCarga, registrar, editar } = useVentas(fecha);
  const [formulario, setFormulario] = useState({ abierto: false, venta: null });

  // Al cargar, muestra el domingo más reciente.
  useEffect(() => {
    if (!fecha && domingos.length > 0) setFecha(domingos[0].fecha);
  }, [domingos, fecha]);

  const domingoActual = domingos.find((d) => d.fecha === fecha);
  const estaCerrado = Number(domingoActual?.cerrado) === 1;

  const abrirRegistro = () => {
    if (abiertos.length === 0) {
      advertencia('No hay domingos abiertos. Registra un domingo en el módulo Domingos antes de cargar ventas.', { titulo: 'Sin domingos disponibles' });
      return;
    }
    if (activos.length === 0) {
      advertencia('No hay meseros activos para asignarles ventas.', { titulo: 'Sin meseros activos' });
      return;
    }
    setFormulario({ abierto: true, venta: null });
  };

  const guardar = async (datos) => {
    const respuesta = formulario.venta ? await editar(formulario.venta.id, datos) : await registrar(datos);
    if (datos.fecha !== fecha) setFecha(datos.fecha);
    return respuesta;
  };

  const columnas = [
    { titulo: 'Mesero', render: (v) => <span className="font-semibold text-huilense-700">{nombreCompleto(v)}</span> },
    { titulo: 'Identificación', campo: 'identificacion' },
    { titulo: 'Total vendido', alinear: 'right', render: (v) => <span className="font-semibold text-emerald-700">{formatearPesos(v.total_vendido)}</span> },
    {
      titulo: 'Acción', alinear: 'right', render: (v) => (estaCerrado
        ? <span className="text-xs text-slate-400">Corte cerrado</span>
        : <Boton tamano="sm" variante="secundario" icono={Pencil} onClick={() => setFormulario({ abierto: true, venta: v })}>Editar</Boton>)
    }
  ];

  return (
    <>
      <EncabezadoPagina titulo="Ventas" descripcion="Registra y corrige las ventas de cada mesero por domingo."
        acciones={<Boton icono={Plus} onClick={abrirRegistro}>Registrar venta</Boton>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaKpi titulo="Ventas registradas" valor={ventas.length} icono={Receipt} />
        <TarjetaKpi titulo="Total vendido" valor={formatearPesos(total)} icono={Wallet} />
        <TarjetaKpi titulo="Estado del domingo" valor={domingoActual ? (estaCerrado ? 'Cerrado' : 'Abierto') : '—'}
          detalle={domingoActual ? `${domingoActual.meseros_requeridos} meseros requeridos` : 'Sin domingo seleccionado'} icono={CalendarDays} />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Campo como="select" etiqueta="Ver ventas del domingo" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full max-w-sm">
          {domingos.length === 0 && <option value="">No hay domingos registrados</option>}
          {domingos.map((d) => <option key={d.id} value={d.fecha}>{formatearFechaLarga(d.fecha)}</option>)}
        </Campo>
        {domingoActual && (estaCerrado ? <Insignia>Corte cerrado</Insignia> : <Insignia tono="exito">Abierto</Insignia>)}
      </div>

      <Tabla columnas={columnas} filas={ventas} cargando={cargando}
        mensajeVacio={errorCarga ? `No se pudieron cargar las ventas: ${errorCarga.message}` : 'No hay ventas registradas para este domingo.'} />

      <FormularioVenta abierto={formulario.abierto} venta={formulario.venta} domingos={abiertos} meseros={activos}
        fechaInicial={fecha} onGuardar={guardar} onCerrar={() => setFormulario({ abierto: false, venta: null })} />
    </>
  );
}

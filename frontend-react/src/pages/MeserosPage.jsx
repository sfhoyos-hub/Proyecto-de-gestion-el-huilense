import { useMemo, useState } from 'react';
import { Pencil, Search, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import FormularioMesero from '../components/meseros/FormularioMesero';
import Boton from '../components/ui/Boton';
import Campo from '../components/ui/Campo';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import Insignia from '../components/ui/Insignia';
import Tabla from '../components/ui/Tabla';
import TarjetaKpi from '../components/ui/TarjetaKpi';
import useAlertas from '../hooks/useAlertas';
import useMeseros from '../hooks/useMeseros';
import { nombreCompleto } from '../utils/formato';

export default function MeserosPage() {
  const { meseros, activos, cargando, error: errorCarga, registrar, actualizar, cambiarEstado } = useMeseros();
  const { exito, error, confirmar } = useAlertas();
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState({ abierto: false, mesero: null });

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return meseros;
    return meseros.filter((m) =>
      [m.nombre, m.apellido, m.identificacion, m.email].some((campo) => String(campo || '').toLowerCase().includes(texto)));
  }, [meseros, busqueda]);

  const alternarEstado = async (mesero) => {
    const desactivar = mesero.estado === 'ACTIVO';
    const acepta = await confirmar(
      desactivar
        ? `${nombreCompleto(mesero)} no podrá iniciar sesión. Su historial se conserva.`
        : `${nombreCompleto(mesero)} podrá volver a iniciar sesión.`,
      { titulo: desactivar ? '¿Desactivar mesero?' : '¿Activar mesero?', textoConfirmar: desactivar ? 'Desactivar' : 'Activar', peligro: desactivar });
    if (!acepta) return;

    try {
      const respuesta = await cambiarEstado(mesero.id, desactivar ? 'INACTIVO' : 'ACTIVO');
      exito(respuesta?.mensaje || 'Estado actualizado correctamente.');
    } catch (problema) {
      error(problema);
    }
  };

  const columnas = [
    { titulo: 'ID', render: (m) => <span className="font-semibold text-slate-500">#{m.id}</span> },
    { titulo: 'Nombre', render: (m) => <span className="font-semibold text-huilense-700">{nombreCompleto(m)}</span> },
    { titulo: 'Identificación', campo: 'identificacion' },
    { titulo: 'Correo', render: (m) => <span className="text-slate-500">{m.email}</span> },
    { titulo: 'Ingreso', campo: 'fecha_ingreso' },
    { titulo: 'Estado', render: (m) => <Insignia tono={m.estado === 'ACTIVO' ? 'exito' : 'peligro'}>{m.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</Insignia> },
    {
      titulo: 'Acciones', alinear: 'right', render: (m) => (
        <div className="flex justify-end gap-2">
          <Boton tamano="sm" variante="secundario" icono={Pencil} onClick={() => setFormulario({ abierto: true, mesero: m })}
            aria-label={`Editar a ${nombreCompleto(m)}`}>Editar</Boton>
          <Boton tamano="sm" variante={m.estado === 'ACTIVO' ? 'peligro' : 'primario'} icono={m.estado === 'ACTIVO' ? UserX : UserCheck}
            onClick={() => alternarEstado(m)}>{m.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}</Boton>
        </div>
      )
    }
  ];

  const guardar = (datos) => (formulario.mesero ? actualizar(formulario.mesero.id, datos) : registrar(datos));

  return (
    <>
      <EncabezadoPagina titulo="Meseros" descripcion="Registro, edición y estado de vinculación del personal."
        acciones={<Boton icono={UserPlus} onClick={() => setFormulario({ abierto: true, mesero: null })}>Registrar mesero</Boton>} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaKpi titulo="Total de meseros" valor={meseros.length} icono={Users} />
        <TarjetaKpi titulo="Activos" valor={activos.length} icono={UserCheck} />
        <TarjetaKpi titulo="Inactivos" valor={meseros.length - activos.length} icono={UserX} />
      </div>

      <Campo etiqueta="Buscar mesero" icono={Search} type="search" placeholder="Nombre, cédula o correo…"
        value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="mb-4 max-w-md" />

      <Tabla columnas={columnas} filas={filtrados} cargando={cargando}
        mensajeVacio={errorCarga ? `No se pudo cargar la lista: ${errorCarga.message}` : 'No hay meseros que coincidan.'} />

      <FormularioMesero abierto={formulario.abierto} mesero={formulario.mesero} onGuardar={guardar}
        onCerrar={() => setFormulario({ abierto: false, mesero: null })} />
    </>
  );
}

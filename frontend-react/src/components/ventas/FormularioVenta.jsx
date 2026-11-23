import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import Boton from '../ui/Boton';
import Campo from '../ui/Campo';
import Modal from '../ui/Modal';
import useAlertas from '../../hooks/useAlertas';
import useConvocatoria from '../../hooks/useConvocatoria';
import useFormulario from '../../hooks/useFormulario';
import { reglas } from '../../utils/validaciones';
import { formatearFechaLarga, formatearPesos, nombreCompleto } from '../../utils/formato';

const VACIO = { fecha: '', mesero_id: '', total_vendido: '' };

// Formulario reutilizable para registrar o editar una venta.
// En "Mesero" solo aparecen los meseros convocados al domingo elegido.
// Props: abierto, venta (solo al editar), domingos (abiertos), meseros (activos),
// fechaInicial, onGuardar(datos) -> promesa con { mensaje }, onCerrar.
export default function FormularioVenta({ abierto, venta, domingos, meseros, fechaInicial, onGuardar, onCerrar }) {
  const esEdicion = Boolean(venta);
  const { exito, error, advertencia } = useAlertas();
  const [guardando, setGuardando] = useState(false);

  const reglasVenta = useMemo(() => ({
    fecha: [reglas.seleccion('El domingo')],
    mesero_id: [reglas.seleccion('El mesero')],
    total_vendido: [reglas.montoValido('El total vendido')]
  }), []);
  const { valores, errores, cambiar, asignar, validar, reiniciar } = useFormulario(VACIO, reglasVenta);

  const domingoElegido = domingos.find((d) => d.fecha === valores.fecha);
  const { convocados, tieneConvocatoria, cargando: cargandoConvocatoria } = useConvocatoria(abierto ? domingoElegido?.id ?? null : null);

  useEffect(() => {
    if (!abierto) return;
    reiniciar(venta
      ? { fecha: venta.fecha, mesero_id: String(venta.mesero_id), total_vendido: String(venta.total_vendido) }
      : { ...VACIO, fecha: domingos.some((d) => d.fecha === fechaInicial) ? fechaInicial : domingos[0]?.fecha || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, venta]);

  // Si el domingo tiene convocatoria, solo se ofrecen los meseros convocados.
  // Al editar se muestra también el mesero de la venta aunque ya no esté activo.
  const opcionesMeseros = useMemo(() => {
    const idsConvocados = new Set(convocados.map((c) => c.mesero_id));
    const lista = tieneConvocatoria ? meseros.filter((m) => idsConvocados.has(m.id)) : meseros;
    if (!venta || lista.some((m) => m.id === venta.mesero_id)) return lista;
    return [{ id: venta.mesero_id, nombre: venta.nombre, apellido: venta.apellido, identificacion: venta.identificacion }, ...lista];
  }, [meseros, venta, convocados, tieneConvocatoria]);

  // Si al cambiar de domingo el mesero elegido ya no está en la lista, se limpia.
  useEffect(() => {
    if (cargandoConvocatoria || !valores.mesero_id) return;
    if (!opcionesMeseros.some((m) => String(m.id) === String(valores.mesero_id))) asignar('mesero_id', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opcionesMeseros, cargandoConvocatoria]);

  let ayudaMesero = 'Elige primero el domingo.';
  if (cargandoConvocatoria) ayudaMesero = 'Cargando los meseros convocados…';
  else if (domingoElegido && tieneConvocatoria) ayudaMesero = `Solo aparecen los ${opcionesMeseros.length} meseros convocados para este domingo.`;
  else if (domingoElegido) ayudaMesero = 'Este domingo no tiene meseros convocados: se muestran todos los activos. Puedes convocarlos en Domingos → Ver meseros.';

  const guardar = async (evento) => {
    evento.preventDefault();
    const problemas = validar();
    if (problemas.length > 0) {
      advertencia(problemas);
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await onGuardar(valores);
      if (respuesta === null) return; // el usuario decidió no continuar: el formulario sigue abierto
      onCerrar();
      exito(respuesta?.mensaje || 'Venta guardada correctamente.');
    } catch (problema) {
      error(problema);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={esEdicion ? 'Editar venta' : 'Registrar venta'}
      pie={(
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" form="form-venta" icono={Save} cargando={guardando}>
            {esEdicion ? 'Guardar cambios' : 'Registrar venta'}
          </Boton>
        </>
      )}>
      <form id="form-venta" onSubmit={guardar} noValidate className="space-y-4">
        <Campo como="select" etiqueta="Domingo" name="fecha" value={valores.fecha} onChange={cambiar} error={errores.fecha}
          ayuda="Solo aparecen los domingos que aún no tienen el corte cerrado.">
          <option value="">Selecciona un domingo…</option>
          {domingos.map((d) => <option key={d.id} value={d.fecha}>{formatearFechaLarga(d.fecha)}</option>)}
        </Campo>
        <Campo como="select" etiqueta="Mesero" name="mesero_id" value={valores.mesero_id} onChange={cambiar} error={errores.mesero_id}
          disabled={cargandoConvocatoria} ayuda={ayudaMesero}>
          <option value="">{opcionesMeseros.length === 0 ? 'No hay meseros convocados disponibles' : 'Selecciona un mesero…'}</option>
          {opcionesMeseros.map((m) => (
            <option key={m.id} value={m.id}>{nombreCompleto(m)}{m.identificacion ? ` · ${m.identificacion}` : ''}</option>
          ))}
        </Campo>
        <Campo etiqueta="Total vendido (COP)" name="total_vendido" type="number" min="0" step="100" inputMode="numeric"
          value={valores.total_vendido} onChange={cambiar} error={errores.total_vendido}
          ayuda={valores.total_vendido !== '' ? formatearPesos(valores.total_vendido) : 'Escribe el valor sin puntos ni signos.'} />
      </form>
    </Modal>
  );
}

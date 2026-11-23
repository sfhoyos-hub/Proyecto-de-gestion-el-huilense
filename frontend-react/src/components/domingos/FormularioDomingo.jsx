import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import Boton from '../ui/Boton';
import Campo from '../ui/Campo';
import Modal from '../ui/Modal';
import useAlertas from '../../hooks/useAlertas';
import useFormulario from '../../hooks/useFormulario';
import { ESTRATEGIAS } from '../../hooks/useConvocatoria';
import { esFechaValida, esDomingo, reglas } from '../../utils/validaciones';
import { formatearFechaLarga, nombreCompleto } from '../../utils/formato';

const VACIO = { fecha: '', meseros_requeridos: '', estrategia: 'rendimiento' };

// Fecha (YYYY-MM-DD) del próximo domingo, o de hoy si hoy es domingo.
function proximoDomingo() {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() + ((7 - hoy.getDay()) % 7));
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

// Arma el mensaje final con los meseros que el sistema convocó.
function mensajeDeConvocatoria(respuesta) {
  const convocados = respuesta?.convocatoria?.convocados || [];
  const descanso = respuesta?.convocatoria?.descanso || [];
  return [
    respuesta?.mensaje || 'Domingo registrado correctamente.',
    ...convocados.map((m, i) => `${i + 1}. ${nombreCompleto(m)}`),
    ...(descanso.length > 0 ? [`En descanso: ${descanso.length} mesero(s).`] : [])
  ];
}

// Formulario para programar un domingo. Si se elige otro día, avisa con una ventana.
// Al guardar, el sistema convoca a los meseros con el criterio elegido.
// Props: abierto, onGuardar(datos) -> promesa con { mensaje }, onCerrar.
export default function FormularioDomingo({ abierto, onGuardar, onCerrar }) {
  const { exito, error, advertencia } = useAlertas();
  const [guardando, setGuardando] = useState(false);

  const reglasDomingo = useMemo(() => ({
    fecha: [reglas.obligatorio('La fecha'), reglas.domingo()],
    meseros_requeridos: [reglas.enteroPositivo('La cantidad de meseros')]
  }), []);
  const { valores, errores, cambiar, asignar, validar, reiniciar } = useFormulario(VACIO, reglasDomingo);

  useEffect(() => {
    if (abierto) reiniciar(VACIO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const elegirFecha = (evento) => {
    const fecha = evento.target.value;
    if (esFechaValida(fecha) && !esDomingo(fecha)) {
      asignar('fecha', '');
      advertencia([`Elegiste ${formatearFechaLarga(fecha)}.`, 'Solo se pueden registrar domingos. Elige un domingo en el calendario.'],
        { titulo: 'Esa fecha no es domingo' });
      return;
    }
    cambiar(evento);
  };

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
      onCerrar();
      if (respuesta?.aviso) {
        advertencia([respuesta.mensaje || 'Domingo registrado.', respuesta.aviso,
          'Cuando registres meseros, convócalos desde el botón "Ver meseros".'], { titulo: 'Domingo sin meseros convocados' });
      } else {
        exito(mensajeDeConvocatoria(respuesta), { titulo: 'Meseros convocados' });
      }
    } catch (problema) {
      error(problema);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar domingo"
      pie={(
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" form="form-domingo" icono={CalendarPlus} cargando={guardando}>Registrar domingo</Boton>
        </>
      )}>
      <form id="form-domingo" onSubmit={guardar} noValidate className="space-y-4">
        <div>
          <Campo etiqueta="Fecha del domingo" name="fecha" type="date" value={valores.fecha} onChange={elegirFecha}
            error={errores.fecha}
            ayuda={valores.fecha ? formatearFechaLarga(valores.fecha) : 'Solo se aceptan domingos.'} />
          <button type="button" onClick={() => asignar('fecha', proximoDomingo())}
            className="mt-1 text-xs font-semibold text-huilense-600 underline-offset-2 hover:underline">
            Usar el próximo domingo
          </button>
        </div>
        <Campo etiqueta="Meseros requeridos" name="meseros_requeridos" type="number" min="1" step="1" inputMode="numeric"
          value={valores.meseros_requeridos} onChange={cambiar} error={errores.meseros_requeridos}
          ayuda="Cantidad de meseros que se necesitan esa jornada." />
        <Campo como="select" etiqueta="Criterio para convocar" name="estrategia" value={valores.estrategia} onChange={cambiar}
          ayuda="El sistema elige a los meseros que trabajan ese domingo; el resto queda en descanso.">
          {ESTRATEGIAS.map((e) => <option key={e.valor} value={e.valor}>{e.texto}</option>)}
        </Campo>
      </form>
    </Modal>
  );
}

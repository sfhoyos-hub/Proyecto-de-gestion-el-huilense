import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import Boton from '../ui/Boton';
import Campo from '../ui/Campo';
import Modal from '../ui/Modal';
import useAlertas from '../../hooks/useAlertas';
import useFormulario from '../../hooks/useFormulario';
import { MIN_CORREO, MIN_PASSWORD, reglas } from '../../utils/validaciones';

const VACIO = { nombre: '', apellido: '', identificacion: '', email: '', password: '', fecha_ingreso: '' };

// Formulario reutilizable para registrar (sin "mesero") o editar (con "mesero").
// Props: abierto, mesero, onGuardar(datos) -> promesa con { mensaje }, onCerrar.
export default function FormularioMesero({ abierto, mesero, onGuardar, onCerrar }) {
  const esEdicion = Boolean(mesero);
  const { exito, error, advertencia } = useAlertas();
  const [guardando, setGuardando] = useState(false);

  const reglasMesero = useMemo(() => ({
    nombre: [reglas.obligatorio('El nombre')],
    apellido: [reglas.obligatorio('El apellido')],
    identificacion: [reglas.obligatorio('La identificación')],
    email: [reglas.obligatorio('El correo'), reglas.minimo('El correo', MIN_CORREO), reglas.correo()],
    password: esEdicion
      ? [reglas.passwordOpcional(MIN_PASSWORD)]
      : [reglas.obligatorio('La contraseña'), reglas.minimo('La contraseña', MIN_PASSWORD)],
    fecha_ingreso: [reglas.fechaNoFutura('La fecha de ingreso')]
  }), [esEdicion]);

  const { valores, errores, cambiar, validar, reiniciar } = useFormulario(VACIO, reglasMesero);

  useEffect(() => {
    if (abierto) reiniciar(mesero ? { ...VACIO, ...pick(mesero) } : VACIO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, mesero]);

  const guardar = async (evento) => {
    evento.preventDefault();
    const problemas = validar();
    if (problemas.length > 0) {
      advertencia(problemas);
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        ...valores,
        name: `${valores.nombre.trim()} ${valores.apellido.trim()}`,
        ...(esEdicion ? { estado: mesero.estado } : {})
      };
      if (esEdicion && !datos.password) delete datos.password;
      const respuesta = await onGuardar(datos);
      onCerrar();
      exito(respuesta?.mensaje || 'Datos guardados correctamente.');
    } catch (problema) {
      error(problema);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} ancho="lg"
      titulo={esEdicion ? `Editar mesero #${mesero.id}` : 'Registrar nuevo mesero'}
      pie={(
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" form="form-mesero" icono={Save} cargando={guardando}>
            {esEdicion ? 'Guardar cambios' : 'Registrar mesero'}
          </Boton>
        </>
      )}>
      <form id="form-mesero" onSubmit={guardar} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombres" name="nombre" value={valores.nombre} onChange={cambiar} error={errores.nombre} />
        <Campo etiqueta="Apellidos" name="apellido" value={valores.apellido} onChange={cambiar} error={errores.apellido} />
        <Campo etiqueta="Identificación (cédula)" name="identificacion" inputMode="numeric"
          value={valores.identificacion} onChange={cambiar} error={errores.identificacion} />
        <Campo etiqueta="Fecha de ingreso" name="fecha_ingreso" type="date" max={new Date().toISOString().slice(0, 10)}
          value={valores.fecha_ingreso} onChange={cambiar} error={errores.fecha_ingreso} />
        <Campo etiqueta="Correo electrónico" name="email" type="email" autoComplete="off" className="sm:col-span-2"
          value={valores.email} onChange={cambiar} error={errores.email} ayuda={`Mínimo ${MIN_CORREO} caracteres. Lo usará para iniciar sesión.`} />
        <Campo etiqueta={esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña'} name="password" type="password"
          autoComplete="new-password" className="sm:col-span-2" value={valores.password} onChange={cambiar}
          error={errores.password}
          ayuda={esEdicion ? `Déjala vacía para no cambiarla. Mínimo ${MIN_PASSWORD} caracteres.` : `Mínimo ${MIN_PASSWORD} caracteres.`} />
      </form>
    </Modal>
  );
}

function pick({ nombre, apellido, identificacion, email, fecha_ingreso }) {
  return { nombre: nombre || '', apellido: apellido || '', identificacion: identificacion || '', email: email || '', fecha_ingreso: fecha_ingreso || '' };
}

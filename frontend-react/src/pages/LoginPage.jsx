import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, Eye, EyeOff, LockKeyhole, Mail, Receipt, Trophy, UtensilsCrossed } from 'lucide-react';
import Boton from '../components/ui/Boton';
import Campo from '../components/ui/Campo';
import { PAGINA_MESERO } from '../components/layout/RutaProtegida';
import useAuth from '../hooks/useAuth';
import useAlertas from '../hooks/useAlertas';
import useFormulario from '../hooks/useFormulario';
import { MIN_CORREO, MIN_PASSWORD, reglas } from '../utils/validaciones';

const FUNCIONES = [
  { icono: CalendarDays, texto: 'Los domingos de servicio' },
  { icono: Receipt, texto: 'Las ventas de cada mesero' },
  { icono: Trophy, texto: 'El ranking y el cierre de cortes' }
];

const INICIALES = { email: '', password: '' };

export default function LoginPage() {
  const { estaAutenticado, esAdmin, iniciarSesion, motivoSalida, limpiarMotivo } = useAuth();
  const { error, advertencia } = useAlertas();
  const navegar = useNavigate();
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const reglasLogin = useMemo(() => ({
    email: [reglas.obligatorio('El correo'), reglas.minimo('El correo', MIN_CORREO), reglas.correo()],
    password: [reglas.obligatorio('La contraseña'), reglas.minimo('La contraseña', MIN_PASSWORD)]
  }), []);
  const { valores, errores, cambiar, validar } = useFormulario(INICIALES, reglasLogin);

  useEffect(() => {
    if (motivoSalida) {
      advertencia(motivoSalida, { titulo: 'Sesión finalizada' });
      limpiarMotivo();
    }
  }, [motivoSalida, advertencia, limpiarMotivo]);

  if (estaAutenticado && esAdmin) return <Navigate to="/dashboard" replace />;

  const entrar = async (evento) => {
    evento.preventDefault();
    const problemas = validar();
    if (problemas.length > 0) {
      advertencia(problemas, { titulo: 'Revisa los datos de acceso' });
      return;
    }

    setEnviando(true);
    try {
      const usuario = await iniciarSesion(valores);
      if (usuario.rol === 'ADMIN') navegar('/dashboard', { replace: true });
      else window.location.assign(PAGINA_MESERO);
    } catch (problema) {
      error(problema.estado === 401 ? 'El correo o la contraseña no son correctos.' : problema, { titulo: 'No pudiste ingresar' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-huilense-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="size-7 text-oro" aria-hidden="true" />
          <span className="font-serif text-2xl font-bold">El Huilense</span>
        </div>
        <div>
          <h1 className="font-serif text-4xl font-bold leading-tight">Sistema de gestión<br />del restaurante</h1>
          <p className="mt-4 text-white/70">Desde este sistema se administran:</p>
          <ul className="mt-4 space-y-3">
            {FUNCIONES.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><Icono className="size-5 text-oro" /></span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/50">Proyecto universitario de gestión de restaurante.</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={entrar} noValidate className="w-full max-w-md rounded-3xl border border-borde bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <UtensilsCrossed className="size-6 text-huilense-600" aria-hidden="true" />
            <span className="font-serif text-xl font-bold text-huilense-700">El Huilense</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-huilense-700">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Bienvenido. Ingresa con tu cuenta de administrador.</p>

          <div className="mt-6 space-y-4">
            <Campo etiqueta="Correo electrónico" name="email" type="email" autoComplete="username" icono={Mail}
              placeholder="correo@ejemplo.com" value={valores.email} onChange={cambiar}
              minLength={MIN_CORREO} maxLength={254} error={errores.email} ayuda={`Mínimo ${MIN_CORREO} caracteres.`} />
            <div className="relative">
              <Campo etiqueta="Contraseña" name="password" type={verPassword ? 'text' : 'password'} autoComplete="current-password"
                icono={LockKeyhole} placeholder="Tu contraseña" value={valores.password} onChange={cambiar}
                minLength={MIN_PASSWORD} error={errores.password} ayuda={`Mínimo ${MIN_PASSWORD} caracteres.`} />
              <button type="button" onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verPassword}
                className="absolute right-3 top-[34px] rounded p-1 text-slate-400 hover:text-huilense-600">
                {verPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Boton type="submit" tamano="lg" anchoCompleto cargando={enviando} className="mt-6">
            {enviando ? 'Verificando…' : 'Iniciar sesión'}
          </Boton>
          <p className="mt-4 text-center text-xs text-slate-500">
            ¿Olvidaste tu contraseña? Consulta a la persona responsable del sistema.
          </p>
        </form>
      </section>
    </div>
  );
}

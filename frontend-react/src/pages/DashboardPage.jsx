import { CalendarCheck, CalendarDays, Coins, Receipt, Trophy, Users, Wallet } from 'lucide-react';
import BotonModulo from '../components/ui/BotonModulo';
import EncabezadoPagina from '../components/ui/EncabezadoPagina';
import TarjetaKpi from '../components/ui/TarjetaKpi';
import useAuth from '../hooks/useAuth';
import useResumen from '../hooks/useResumen';
import { formatearFechaCorta, formatearPesos } from '../utils/formato';

const MODULOS = [
  { a: '/meseros', texto: 'Meseros', descripcion: 'Registrar, editar y activar personal', icono: Users },
  { a: '/domingos', texto: 'Domingos', descripcion: 'Programar jornadas y cerrar cortes', icono: CalendarDays },
  { a: '/ventas', texto: 'Ventas', descripcion: 'Registrar y corregir ventas', icono: Receipt },
  { href: '/admin/ranking.html', texto: 'Ranking', descripcion: 'Top 6 de cada domingo', icono: Trophy },
  { href: '/admin/bonificaciones.html', texto: 'Bonificaciones', descripcion: 'Generar y consultar', icono: Coins }
];

export default function DashboardPage() {
  const { usuario } = useAuth();
  const { resumen, cargando } = useResumen();
  const valor = (dato) => (cargando ? '…' : dato);

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${usuario?.name || 'Administrador'}`}
        descripcion="Resumen de la operación y accesos rápidos a cada módulo." />

      <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaKpi titulo="Meseros activos" icono={Users}
          valor={valor(resumen?.meserosActivos ?? 0)} detalle={`de ${resumen?.totalMeseros ?? 0} registrados`} />
        <TarjetaKpi titulo="Domingos registrados" icono={CalendarCheck}
          valor={valor(resumen?.domingosRegistrados ?? 0)} detalle={`${resumen?.domingosAbiertos ?? 0} sin cerrar`} />
        <TarjetaKpi titulo="Domingo más reciente" icono={CalendarDays}
          valor={valor(resumen?.ultimoDomingo ? formatearFechaCorta(resumen.ultimoDomingo.fecha) : 'Sin registrar')}
          detalle={resumen?.ultimoDomingo ? (Number(resumen.ultimoDomingo.cerrado) === 1 ? 'Corte cerrado' : 'Abierto a ventas') : 'Registra el primero'} />
        <TarjetaKpi titulo="Ventas de ese domingo" icono={Wallet}
          valor={valor(formatearPesos(resumen?.ventasUltimoDomingo))} detalle="Suma de todos los meseros" />
      </section>

      <section aria-labelledby="titulo-modulos" className="mt-10">
        <h2 id="titulo-modulos" className="mb-4 font-serif text-xl font-bold text-huilense-700">Módulos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((modulo) => <BotonModulo key={modulo.texto} {...modulo} />)}
        </div>
      </section>
    </>
  );
}

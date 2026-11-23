import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, LogOut, Receipt, Users, UtensilsCrossed } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAlertas from '../../hooks/useAlertas';

export const ENLACES = [
  { a: '/dashboard', texto: 'Inicio', icono: LayoutDashboard },
  { a: '/meseros', texto: 'Meseros', icono: Users },
  { a: '/domingos', texto: 'Domingos', icono: CalendarDays },
  { a: '/ventas', texto: 'Ventas', icono: Receipt }
];

function EnlaceMenu({ a, texto, icono: Icono }) {
  return (
    <NavLink to={a}
      className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition
        ${isActive ? 'bg-white text-huilense-700 shadow' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
      <Icono className="size-4" aria-hidden="true" />
      {texto}
    </NavLink>
  );
}

// Estructura común del panel: barra superior con menú y el contenido de cada pantalla.
export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const { confirmar } = useAlertas();
  const navegar = useNavigate();

  const salir = async () => {
    if (await confirmar('Se cerrará tu sesión en este equipo.', { titulo: '¿Cerrar sesión?', textoConfirmar: 'Cerrar sesión' })) {
      cerrarSesion();
      navegar('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-fondo">
      <header className="bg-huilense-800 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="size-6 text-oro" aria-hidden="true" />
            <span className="font-serif text-xl font-bold">El Huilense</span>
          </div>
          <nav aria-label="Menú principal" className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {ENLACES.map((enlace) => <EnlaceMenu key={enlace.a} {...enlace} />)}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{usuario?.name || 'Administrador'}</p>
              <p className="text-xs text-white/60">{usuario?.email}</p>
            </div>
            <button type="button" onClick={salir}
              className="inline-flex items-center gap-1.5 rounded-xl border border-oro/60 px-3 py-1.5 text-sm font-semibold text-oro transition hover:bg-oro hover:text-huilense-800">
              <LogOut className="size-4" aria-hidden="true" /> Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

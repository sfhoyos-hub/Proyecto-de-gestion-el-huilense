import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CLASES = `group flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-4 text-left shadow-sm transition
  hover:-translate-y-0.5 hover:border-huilense-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-huilense-600`;

// Botón grande para entrar a un módulo. Props: a (ruta interna) o href (página externa),
// texto, descripcion e icono.
export default function BotonModulo({ a, href, texto, descripcion, icono: Icono }) {
  const contenido = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-huilense-600 text-white">
        <Icono className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-huilense-700">{texto}</span>
        {descripcion && <span className="block truncate text-xs text-slate-500">{descripcion}</span>}
      </span>
      <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-huilense-600" aria-hidden="true" />
    </>
  );

  return a
    ? <Link to={a} className={CLASES}>{contenido}</Link>
    : <a href={href} className={CLASES}>{contenido}</a>;
}

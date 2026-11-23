// Tarjeta de indicador. Todas tienen el mismo alto y ancho dentro de la grilla.
// Props: titulo, valor, detalle e icono (componente de lucide).
export default function TarjetaKpi({ titulo, valor, detalle, icono: Icono }) {
  return (
    <article className="flex h-32 items-center justify-between gap-4 rounded-2xl border border-borde bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
        <p className="mt-1 truncate font-serif text-2xl font-bold text-huilense-700">{valor}</p>
        {detalle && <p className="mt-0.5 truncate text-xs text-slate-500">{detalle}</p>}
      </div>
      {Icono && (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-huilense-50 text-huilense-600">
          <Icono className="size-6" aria-hidden="true" />
        </div>
      )}
    </article>
  );
}

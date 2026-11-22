import Cargando from './Cargando';

// Tabla reutilizable. Props:
//   columnas: [{ titulo, campo | render(fila), alinear: 'right' }]
//   filas, cargando, mensajeVacio, claveFila (por defecto fila.id)
export default function Tabla({ columnas, filas, cargando = false, mensajeVacio = 'No hay registros.', claveFila = (f) => f.id }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-borde bg-white shadow-sm">
      <table className="min-w-full divide-y divide-borde text-sm">
        <thead className="bg-huilense-50/60">
          <tr>
            {columnas.map((columna) => (
              <th key={columna.titulo} scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-huilense-700 ${columna.alinear === 'right' ? 'text-right' : 'text-left'}`}>
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {cargando && (
            <tr><td colSpan={columnas.length} className="py-10"><Cargando texto="Cargando información…" /></td></tr>
          )}
          {!cargando && filas.length === 0 && (
            <tr><td colSpan={columnas.length} className="px-4 py-10 text-center text-slate-500">{mensajeVacio}</td></tr>
          )}
          {!cargando && filas.map((fila) => (
            <tr key={claveFila(fila)} className="transition hover:bg-slate-50">
              {columnas.map((columna) => (
                <td key={columna.titulo} className={`whitespace-nowrap px-4 py-3 ${columna.alinear === 'right' ? 'text-right' : ''}`}>
                  {columna.render ? columna.render(fila) : fila[columna.campo] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

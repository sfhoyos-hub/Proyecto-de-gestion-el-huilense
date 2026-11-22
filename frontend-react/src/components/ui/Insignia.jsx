const TONOS = {
  exito: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  peligro: 'bg-red-50 text-red-700 ring-red-200',
  neutro: 'bg-slate-100 text-slate-600 ring-slate-200',
  marca: 'bg-huilense-50 text-huilense-700 ring-huilense-100'
};

// Etiqueta pequeña de estado. Props: tono (exito | peligro | neutro | marca).
export default function Insignia({ tono = 'neutro', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

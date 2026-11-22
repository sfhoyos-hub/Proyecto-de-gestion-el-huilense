import { LoaderCircle } from 'lucide-react';

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 text-sm text-slate-500">
      <LoaderCircle className="size-5 animate-spin text-huilense-600" aria-hidden="true" />
      {texto}
    </div>
  );
}

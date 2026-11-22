import { AlertasProvider } from './context/AlertasContext';

// El contexto global de alertas envuelve a toda la aplicación.
export default function App() {
  return (
    <AlertasProvider>
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-fondo">
        <h1 className="font-serif text-4xl font-bold text-huilense-700">El Huilense</h1>
        <p className="text-slate-500">Frontend con React, Vite y Tailwind CSS en construcción.</p>
      </main>
    </AlertasProvider>
  );
}

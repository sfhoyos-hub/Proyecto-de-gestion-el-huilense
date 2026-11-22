import { AlertasProvider } from './context/AlertasContext';
import { AuthProvider } from './context/AuthContext';

// Contextos globales (alertas y sesión) envuelven a toda la aplicación.
export default function App() {
  return (
    <AlertasProvider>
      <AuthProvider>
        <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-fondo">
          <h1 className="font-serif text-4xl font-bold text-huilense-700">El Huilense</h1>
          <p className="text-slate-500">Frontend con React, Vite y Tailwind CSS en construcción.</p>
        </main>
      </AuthProvider>
    </AlertasProvider>
  );
}

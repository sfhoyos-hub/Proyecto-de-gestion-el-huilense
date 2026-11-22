import { useContext } from 'react';
import { AlertasContext } from '../context/AlertasContext';

// Custom hook para usar las alertas globales: const { exito, error } = useAlertas();
export default function useAlertas() {
  const contexto = useContext(AlertasContext);
  if (!contexto) throw new Error('useAlertas debe usarse dentro de <AlertasProvider>.');
  return contexto;
}

# El Huilense · Frontend React

Interfaz nueva de **inicio de sesión, meseros, domingos y ventas**, hecha con
React, Vite y Tailwind CSS. Las demás pantallas (ranking, bonificaciones y la
vista del mesero) siguen en la carpeta `frontend` y comparten la misma sesión.

## Requisitos

- Node.js 18 o superior (`node --version`).
- El backend configurado (`backend/.env` con `JWT_SECRET`) y un administrador creado.

## Ejecutar (forma normal)

```bash
cd frontend-react
npm install
npm run build
cd ../backend
npm install
node app.js
```

Abre http://localhost:3000. Express redirige a la aplicación React (`/app/`).
Cada vez que cambies algo dentro de `frontend-react`, repite `npm run build`.

## Ejecutar en modo desarrollo (recarga automática)

En una terminal: `cd backend` y `node app.js`.
En otra terminal: `cd frontend-react` y `npm run dev`.
Abre http://localhost:5173/app/. Vite reenvía las peticiones de la API al puerto 3000.

## Cómo está organizado

| Carpeta | Qué contiene | Requisito del curso |
|---|---|---|
| `src/context` | `AuthContext` (sesión) y `AlertasContext` (ventanas de mensajes) | Contexto global |
| `src/hooks` | `useAuth`, `useAlertas`, `useFormulario`, `useListado`, `useMeseros`, `useDomingos`, `useVentas`, `useResumen` | Custom hooks |
| `src/components/ui` | `Boton`, `Campo`, `Modal`, `ModalAlerta`, `Tabla`, `TarjetaKpi`, `Insignia`, `BotonModulo`... | Componentes reutilizables con props |
| `src/components/{meseros,domingos,ventas}` | Formularios de cada módulo (reciben datos y funciones por props) | Props |
| `src/pages` | Una pantalla por módulo | |
| `src/api` | Cliente HTTP y sesión guardada en el navegador | |
| `src/utils` | Validaciones (domingo, mínimos de 8 caracteres, correo) y formatos de fecha y pesos | |

## Reglas de la interfaz

- Los mensajes de éxito, error y advertencia salen en una ventana pequeña al frente.
- Al registrar un domingo solo se aceptan domingos; otro día muestra una alerta y limpia el campo.
- En el inicio de sesión, el correo y la contraseña piden al menos 8 caracteres.
- El backend vuelve a validar todo: la interfaz solo evita errores antes de enviar.

# Sistema de Gestión El Huilense

Sistema web para administrar las jornadas dominicales del restaurante El Huilense:
meseros, domingos, ventas, ranking (Top 6), bonificaciones y convocatorias.
Backend en Node.js + Express + SQLite. Interfaz nueva en React + Vite + Tailwind CSS
(carpeta `frontend-react`) y panel clásico en HTML, CSS y JavaScript (carpeta `frontend`).

## Cómo arrancar el programa (paso a paso)

Necesitas **Git**, **Node.js 18 o mayor** (`node --version`) y un navegador.
Escribe cada bloque en una terminal (en Windows: Git Bash) y pulsa Enter.

**1. Descargar el proyecto**

```bash
git clone https://github.com/sfhoyos-hub/Proyecto-de-gestion-el-huilense.git
cd Proyecto-de-gestion-el-huilense
```

Si te indicaron una rama, cámbiate a ella, por ejemplo:
`git checkout PH-31-rediseno-frontend-react-tailwind`.
Sin Git: en GitHub, botón verde **Code → Download ZIP**, descomprime y abre esa carpeta en la terminal.

**2. Preparar el servidor**

```bash
cd backend
npm install
printf 'JWT_SECRET=cambia-este-secreto-por-uno-largo-123\nJWT_EXPIRES_IN=12h\n' > .env
node scripts/crearAdmin.js
```

El último comando pide nombre, correo y una contraseña de al menos 12 caracteres:
con esos datos entras como administrador. Si ya tenías un `backend/.env`, no ejecutes la línea `printf`.

**3. Compilar la interfaz nueva** (solo si existe la carpeta `frontend-react`)

```bash
cd ../frontend-react
npm install
npm run build
cd ../backend
```

**4. Encender el servidor** (deja esta terminal abierta)

```bash
node app.js
```

Debe decir `Servidor de El Huilense escuchando en http://localhost:3000`.
Abre **http://localhost:3000** en el navegador. Para apagarlo: **Ctrl + C**.

Portal público de sugerencias: http://localhost:3000/portal-sugerencias/index.html

### Si algo falla

| Qué pasa | Qué hacer |
| --- | --- |
| "No se pudo conectar con el servidor" | Revisa que `node app.js` siga corriendo y usa http://localhost:3000 (no Live Server ni Live Preview) |
| `EADDRINUSE` o "Port 3000 already in use" | Ya hay otro servidor abierto: ciérralo con Ctrl + C (en Windows: `taskkill //F //IM node.exe`) |
| "La autenticación no está configurada" | Falta `backend/.env`: repite la línea `printf` del paso 2 |
| `Cannot find module` | Falta `npm install` dentro de `backend` (o de `frontend-react`) |
| Quiero empezar con datos limpios | Apaga el servidor, borra `backend/database.sqlite` y repite `node scripts/crearAdmin.js` |

## Pruebas automáticas

```bash
cd backend
npm test        # pruebas de arquitectura y patrones (desde la Parte C2)
```

## Arquitectura

Capas (de arriba hacia abajo): `frontend` y `frontend-react` (presentación) → `backend/aplicacion`
(API REST y seguridad) → `backend/negocio` → `backend/dominio` (modelo y
puertos) ← `backend/infraestructura` (persistencia, auditoría, Nequi,
entrega de notificaciones).

La correspondencia completa con los diagramas está en
`backend/CAMBIOS_REFACTOR.md` (sección "Fase 2"). La interfaz React se describe en
`frontend-react/README.md`.

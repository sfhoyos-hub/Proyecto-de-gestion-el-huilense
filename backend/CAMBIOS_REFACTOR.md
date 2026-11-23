# Refactor del backend (fase 1: código espagueti y métodos largos)

Arquitectura por módulo: routes -> controller -> service -> repository -> BD.

Base compartida:
- utils/validaciones.js  (esFechaValida, esIdValido, obtenerMontoValido, esTextoNoVacio)
- utils/errores.js       (AppError)
- middleware/errorHandler.js (único lugar que responde errores; nunca envía error.message)
- infraestructura/persistencia/transaccion.js (conTransaccion / enTransaccion)
- infraestructura/persistencia/initDB.js (movido desde database/, una función por tabla)

Módulos divididos en 4 archivos: meseros, ventas, domingos, ranking, racha, bonificaciones.
login: routes, controller, autenticacion.service y repository.
middleware/auth.middleware.js: requireAuth orquesta extraerToken, verificarToken,
cargarUsuario y validarEstadoActivo.

Ver el prompt de continuación para lo que sigue (diagramas, BD, frontend).

## Punto A: ajustes de lógica

- Estados de usuario/mesero: solo ACTIVO | INACTIVO (utils/estados.js). Se eliminó 'descanso'.
  initDB migra los datos existentes en cada arranque (idempotente).
- PATCH /meseros/:id/estado (ADMIN). DELETE /meseros/:id sigue desactivando.
- POST /domingos exige que la fecha sea domingo (esDomingo en utils/validaciones.js).
- Se eliminó POST /ranking/generar: el ranking se calcula solo al cerrar el corte,
  en la misma transacción que las rachas y el cierre (domingos.service.ejecutarCierre).
- Bonificaciones: el monto llega por body (10000 por defecto, debe ser > 0) y la
  columna estado es REGISTRADA | PAGADA.

## Punto B: seguridad

- Contraseñas: ya no existe la comparación en texto plano del login. utils/passwords.js
  es el único lugar que cifra/compara (bcrypt). initDB (migraciones.js) cifra al arrancar
  cualquier contraseña que aún estuviera guardada en texto plano.
- requireAuth se mantiene dividido en extraerToken, verificarToken, cargarUsuario y
  validarEstadoActivo; ahora no contiene SQL (usa modulos/login/login.repository.js).
- Auditoría (puerto IAuditoria en dominio/puertos, implementación en
  infraestructura/auditoria): tabla `auditoria` de solo escritura (triggers).
  - Accesos denegados (401/403): middleware/auditoriaAccesos.middleware.js, antes de
    errorHandler. Si la auditoría falla, el cliente recibe igual su 401/403.
  - Cambios de montos (ventas, bonificaciones) y de cuentas (alta, correo, contraseña,
    estado de meseros): se registran dentro de la misma transacción que el cambio.
    Si la auditoría falla, el cambio no se guarda. Nunca se guardan contraseñas ni hashes.

# Fase 2: arquitectura y paquetes (diagramas Vol2 y Vol4)

La lógica de los módulos existentes no cambió: las mismas peticiones devuelven
las mismas respuestas y la misma auditoría (verificado con una prueba de humo
antes y después). Solo se movieron archivos, se cambiaron los `require` para
usar puertos y se agregaron los módulos que faltaban.

## Correspondencia diagrama -> carpetas

| Capa / paquete del diagrama            | Carpeta                                                    |
|----------------------------------------|------------------------------------------------------------|
| Presentación: Panel de Administración  | frontend/admin                                             |
| Presentación: Vista del Mesero         | frontend/mesero                                            |
| Presentación: Portal de Sugerencias    | frontend/portal-sugerencias                                |
| Aplicación: API REST / Controladores   | backend/aplicacion/api/<recurso> (routes + controller)     |
| Aplicación: Seguridad (rol)            | backend/aplicacion/seguridad                               |
| Negocio: Autenticación y acceso        | backend/negocio/autenticacion                              |
| Negocio: Gestión de meseros            | backend/negocio/meseros                                    |
| Negocio: Ventas y corte dominical      | backend/negocio/ventas-corte (ventas, domingos, temporadas)|
| Negocio: Ranking y rachas              | backend/negocio/ranking-rachas                             |
| Negocio: Reportes e historial          | backend/negocio/reportes                                   |
| Negocio: Convocatoria «Strategy»       | backend/negocio/convocatoria (+ estrategias/)              |
| Negocio: Bonificaciones                | backend/negocio/bonificaciones                             |
| Negocio: Pagos                         | backend/negocio/pagos                                      |
| Negocio: Notificaciones «Observer»     | backend/negocio/notificaciones (GestorNotificaciones)      |
| Negocio: Sugerencias                   | backend/negocio/sugerencias                                |
| Dominio: dominio.usuarios ... sugerencias | backend/dominio/<paquete> (una clase por entidad)       |
| Dominio: dominio.puertos               | backend/dominio/puertos (IRepositorio, IAuditoria, IPasarelaPago) |
| Infraestructura: Persistencia (ACID)   | backend/infraestructura/persistencia (+ repositorios/)     |
| Infraestructura: Auditoría             | backend/infraestructura/auditoria                          |
| Infraestructura: Integración Nequi «Adapter» | backend/infraestructura/nequi/NequiAdapter.js        |
| Arquitectura: Entrega de notificaciones| backend/infraestructura/notificaciones                     |

`backend/utils` queda como utilidades transversales (errores, validaciones,
estados, contraseñas). `backend/contenedor.js` es la raíz de composición.

## Cómo se cumple «import» (implementa puertos)

- La lógica de negocio y la capa de aplicación ya no hacen `require` de la
  infraestructura. Piden el puerto por nombre: `puerto('repositorio.ventas')`,
  `puerto('auditoria')`, `puerto('pasarelaPago')` (dominio/puertos/registro.js).
- Cada repositorio implementa `IRepositorio`; la auditoría implementa
  `IAuditoria`; `NequiAdapter` implementa `IPasarelaPago`.
- `contenedor.js` registra los adaptadores al arrancar y verifica que cumplan
  el contrato. `npm test` comprueba que ninguna capa importe a la que no debe.

## Módulos nuevos (endpoints)

- Temporadas (ADMIN): `GET/POST /temporadas`.
- Convocatoria «Strategy»: `POST /convocatorias` (ADMIN, body
  `{ domingo_id, estrategia: 'rendimiento' | 'antiguedad' }`),
  `GET /convocatorias/:domingo_id` (ADMIN), `GET /convocatorias/mias` (MESERO).
- Notificaciones «Observer» (MESERO): `GET /notificaciones`,
  `PATCH /notificaciones/:id/leida`. Se generan al convocar, al cerrar el corte
  (ranking), al generar bonificaciones y al pagar.
- Pagos + Nequi: `GET/PUT /pagos/cuenta` (MESERO), `GET/PUT /pagos/cuentas/:mesero_id`
  (ADMIN), `POST /pagos/bonificaciones/:id` (ADMIN), `GET /pagos` (ADMIN).
  Los cambios de cuenta y los pagos quedan en la auditoría.
  Sin `NEQUI_API_URL` el adaptador funciona en modo simulado; el celular
  3000000000 simula un rechazo.
- Sugerencias: `POST /sugerencias` (público), `GET /sugerencias` (ADMIN).
- Reportes: `GET /reportes/resumen?desde&hasta` (ADMIN),
  `GET /reportes/historial/:mesero_id` (ADMIN o el propio MESERO).

## Únicos cambios en la lógica existente

- `domingos.service` (cierre de corte) y `bonificaciones.service` ahora avisan
  al Gestor de notificaciones, dentro de la misma transacción. Las respuestas
  no cambian.

## Sugerencias para la siguiente versión de los diagramas

- Paquetes: agregar `dominio.reportes (+ Reporte)` y `+ DatosNequi` en
  `dominio.pagos` (ya están en el diagrama de arquitectura).
- Paquetes: agregar "Entrega de notificaciones" en infraestructura (está en el
  de arquitectura).
- Arquitectura: la capa 4 "Acceso a datos" corresponde a
  `infraestructura/persistencia/repositorios`.

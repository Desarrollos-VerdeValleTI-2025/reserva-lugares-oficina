# Backend — Reserva de Lugares de Oficina

## Framework y stack

- Node.js + Express `^5.2.1`, módulo tipo CommonJS (`"type": "commonjs"` en `package.json`).
- Dependencias clave: `cors`, `dotenv`, `express-validator`, `helmet`, `jsonwebtoken`, `jwks-rsa`, `morgan`, `mysql2`, `winston`. Dev: `nodemon`.
- Puerto por defecto: `4000` (`process.env.PORT || 4000`).

*(Origen: `reserva-lugares-oficina-api/package.json`, `src/app.js`.)*

## Organización del backend

```
src/
├── config/
│   └── logger.js              # Winston: consola siempre, archivo solo fuera de development
├── db/
│   └── connection.js          # Pool mysql2/promise
├── middlewares/
│   ├── authMiddleware.js      # Valida JWT de Azure AD (jsonwebtoken + jwks-rsa)
│   ├── businessError.js       # Clase BusinessError (errores de negocio, "seguros" de exponer)
│   ├── errorHandler.js        # Manejador de errores centralizado (siempre al final)
│   ├── notFoundHandler.js     # 404 estándar
│   └── reservationValidators.js # express-validator para body de reservas
├── controllers/
│   ├── seatsController.js
│   └── reservationsController.js
├── routes/
│   ├── health.routes.js
│   ├── seats.routes.js
│   └── reservations.routes.js
├── services/
│   ├── seatsService.js        # CALL web_se_seats_bydate
│   └── reservationsService.js # CALL a los SPs de reservas
└── app.js                     # Bootstrap: middlewares globales + montaje de rutas
```

*(Origen: código real, coincide con lo descrito en `reserva-lugares-oficina-api/README.md`.)*

## Controllers

- `seatsController.getSeats(req,res,next)`: valida que `date` venga en query (si no, `400 VALIDATION_ERROR`); llama a `seatsService.getSeatsGrid(date)`; responde `{success:true,data:seatsGrid}`.
- `reservationsController`:
  - `getMine`: llama `reservationsService.getReservationsByUserEmail(req.user.email)`.
  - `create`: toma `seatId`/`date` del body y `userEmail` de `req.user.email`; llama `createReservation`; responde `201`.
  - `update`: toma `id` de params, `seatId`/`date` del body, `userEmail` del token; llama `updateReservation`.
  - `remove`: toma `id` de params y `userEmail` del token; llama `deleteReservation`.
- Todos los controllers usan `try/catch` y delegan el error a `next(err)` — nunca manejan la respuesta de error directamente (excepto la validación de `date` faltante en `getSeats`, que responde inline).

## Services

- `seatsService.getSeatsGrid(date)`: `CALL web_se_seats_bydate(?)`, mapea filas a `{id, code, row, column, status}`.
- `reservationsService`:
  - `getReservationsByUserEmail(userEmail)`: `CALL web_se_reservations_byuser(?)`, mapea a `{id, seatId, seatCode, date, userEmail}`.
  - `createReservation({seatId,date,userEmail})`: `CALL web_in_create_reservation(?,?,?)`, obtiene `reservation_id` del primer result set, y hace una segunda consulta a `seatsService.getSeatsGrid(date)` para resolver el `seatCode` correspondiente.
  - `updateReservation(id,{seatId,date,userEmail})`: análogo con `web_up_update_reservation`.
  - `deleteReservation(id,userEmail)`: `CALL web_de_cancel_reservation(?,?)`.
  - En los tres casos de escritura, si MySQL lanza `ER_SIGNAL_EXCEPTION` (proveniente de un `SIGNAL` en el stored procedure), se traduce a un `BusinessError(err.sqlMessage)` — es decir, el mensaje de validación de negocio definido en SQL llega tal cual al cliente HTTP.

## Middlewares

| Middleware | Función |
|---|---|
| `authMiddleware.js` | Verifica `Authorization: Bearer <token>`; valida firma (JWKS de Azure AD), audiencia y emisor; setea `req.user.email`; si falla, `401 UNAUTHORIZED`. Se aplica globalmente a `/api/*` (`app.use('/api', authMiddleware)`) y puntualmente a `/health/secure`. |
| `reservationValidators.js` | `express-validator`: `seatId` requerido y entero; `date` formato ISO8601; si falla, `400 VALIDATION_ERROR` con los mensajes concatenados. Se aplica en `POST` y `PUT` de `/api/reservations`. |
| `businessError.js` | Clase `BusinessError extends Error` con `status` (default 400), `code` (default `VALIDATION_ERROR`) y `expose=true`. |
| `errorHandler.js` | Middleware de 4 argumentos (Express error handler); loguea con `winston` (`logger.error`); responde `err.status||500` con `err.message` si `err.expose`, o un mensaje genérico si no. |
| `notFoundHandler.js` | Responde `404 NOT_FOUND` para cualquier ruta no definida. |

Orden de montaje en `app.js`: `express.json()` → `helmet()` → `cors()` → `morgan` (a winston) → rutas de health (públicas) → `authMiddleware` en `/api` → rutas de seats/reservations → `notFoundHandler` → `errorHandler` (siempre al final, según patrón estándar de Express).

## Helpers

No se encontraron archivos de utilidades/helpers genéricos fuera de lo ya descrito (no hay carpeta `utils/` ni `helpers/`).

## Jobs / tareas programadas

No encontrado. No hay `node-cron`, `agenda`, ni ningún mecanismo de tareas en segundo plano.

## Validaciones

- A nivel HTTP: `express-validator` (`reservationValidators.js`) para `seatId`/`date` en `POST`/`PUT`.
- A nivel de negocio: dentro de los stored procedures MySQL (parámetros nulos, fecha pasada, disponibilidad, pertenencia de la reserva al usuario) — ver `DATABASE.md`.
- No hay validación de esquema en `GET /api/seats` más allá de comprobar que `date` no esté vacío (no valida formato de fecha en ese endpoint específico, a diferencia de `POST`/`PUT` de reservas).

## Flujo de cada petición (ejemplo genérico)

`Request` → `express.json()` → `helmet` → `cors` → `morgan` (log) → (si es `/api/*`) `authMiddleware` → middlewares de validación específicos de la ruta → `controller` → `service` → `pool.execute('CALL ...')` en MySQL → mapeo de resultado → `res.json({success:true,data})` → en caso de error en cualquier punto, `next(err)` → `errorHandler`.

## Manejo de errores

- Todo error no capturado explícitamente termina en `errorHandler.js`, que nunca expone el stack trace.
- Los errores de negocio (`BusinessError`, generados a partir de los `SIGNAL`/`RESIGNAL` de los stored procedures) sí exponen su mensaje real al cliente (`expose=true`).
- Cualquier otro error (ej. fallo de conexión a MySQL, error de programación) responde con un mensaje genérico: *"Ha ocurrido un error interno. Por favor, intente nuevamente más tarde."*
- Hallazgo de riesgo: `authMiddleware.js` contiene un `console.log('DEBUG jwt.verify error ->', err.name, '-', err.message)` que se ejecuta en **cualquier ambiente** (no está condicionado por `NODE_ENV`), fuera del pipeline de `winston`. Ver `RISKS.md` y `SECURITY.md`.

## Archivos principales

- `src/app.js` — punto de entrada, orquesta middlewares globales y rutas.
- `src/middlewares/authMiddleware.js` — pieza central de seguridad.
- `src/services/reservationsService.js` — lógica de orquestación de las 4 operaciones de reservas.
- `src/db/connection.js` — pool de conexión MySQL (`mysql2/promise`, `waitForConnections:true`, `connectionLimit:10`, `dateStrings:['DATE']`).

## Health checks

- `GET /health` — público, responde `{success:true,data:{status:'ok'}}`.
- `GET /health/secure` — protegido con `authMiddleware`, responde igual más `user: req.user.email`.

Esto es consistente con el estándar interno de Verde Valle, que exige ambos endpoints en todo backend propio.

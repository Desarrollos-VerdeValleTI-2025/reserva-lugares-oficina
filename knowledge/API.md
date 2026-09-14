# API — Reserva de Lugares de Oficina

Base URL local: `http://localhost:4000` (rutas de health) / `http://localhost:4000/api` (resto). En QAS: `https://practicadespliegue.verdevalle.com.mx/api` (según `.env.qas` del frontend).

Formato de respuesta uniforme en toda la API (contrato fijo desde la primera iteración, según contexto del usuario y confirmado en código):
- Éxito: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

## Endpoints

### GET /health
- **Descripción:** estado básico del servicio.
- **Controller/archivo origen:** `src/routes/health.routes.js` (inline, sin controller separado).
- **Request esperado:** sin parámetros.
- **Response esperado:** `200 { success: true, data: { status: "ok" } }`.
- **Autenticación:** No requerida.
- **Errores conocidos:** ninguno documentado.
- **Observaciones:** único endpoint sin protección alguna.

### GET /health/secure
- **Descripción:** estado básico + confirma el usuario autenticado.
- **Controller/archivo origen:** `src/routes/health.routes.js`.
- **Request esperado:** header `Authorization: Bearer <token>`.
- **Response esperado:** `200 { success: true, data: { status: "ok", user: "<email>" } }`.
- **Autenticación:** Requerida (`authMiddleware`).
- **Errores conocidos:** `401 UNAUTHORIZED` si falta o es inválido el token.
- **Observaciones:** útil para probar la integración con Azure AD sin tocar datos.

### GET /api/seats?date=YYYY-MM-DD
- **Descripción:** grid de los 20 lugares con su estado (`disponible`/`ocupado`) para la fecha indicada.
- **Controller/archivo origen:** `src/controllers/seatsController.js` (`getSeats`) → `src/services/seatsService.js` (`getSeatsGrid`) → `CALL web_se_seats_bydate(?)`.
- **Request esperado:** query param `date` (string). El controller solo valida que no esté vacío; no valida formato ISO en este endpoint.
- **Response esperado:** `200 { success:true, data: [ { id, code, row, column, status }, ... ] }` (20 elementos).
- **Autenticación:** Requerida (`authMiddleware`, montado globalmente en `/api`).
- **Errores conocidos:** `400 VALIDATION_ERROR` si falta `date`; `401 UNAUTHORIZED` sin token válido.
- **Observaciones:** no se determinó comportamiento ante un `date` con formato inválido (no hay validación explícita) — posible comportamiento dependiente de MySQL/mysql2. Ver `INFORMATION_GAPS.md`.

### GET /api/reservations/me
- **Descripción:** reservas activas y futuras del usuario autenticado.
- **Controller/archivo origen:** `src/controllers/reservationsController.js` (`getMine`) → `src/services/reservationsService.js` (`getReservationsByUserEmail`) → `CALL web_se_reservations_byuser(?)`.
- **Request esperado:** sin parámetros; el usuario se identifica por `req.user.email` (token).
- **Response esperado:** `200 { success:true, data: [ { id, seatId, seatCode, date, userEmail }, ... ] }`.
- **Autenticación:** Requerida.
- **Errores conocidos:** `401 UNAUTHORIZED` sin token.
- **Observaciones:** puede devolver 0, 1 o varios elementos. El sistema sí permite varias reservas activas simultáneas para un mismo usuario (confirmado por el desarrollador, ver `INFORMATION_GAPS.md` GAP-10, resuelto); el frontend actual solo usa el primero (limitación conocida de la UI — ver `FRONTEND.md`).

### POST /api/reservations
- **Descripción:** crea una reserva.
- **Controller/archivo origen:** `reservationsController.create` → `reservationsService.createReservation` → `CALL web_in_create_reservation(?,?,?)`.
- **Request esperado:** body `{ "seatId": number, "date": "YYYY-MM-DD" }`. Validado por `express-validator` (`seatId` entero requerido, `date` ISO8601).
- **Response esperado:** `201 { success:true, data: { id, seatId, seatCode, date, userEmail } }`.
- **Autenticación:** Requerida.
- **Errores conocidos:** `400 VALIDATION_ERROR` (body inválido, o mensaje de negocio del SP: fecha pasada / parámetros nulos / lugar no disponible, vía `BusinessError`); `401 UNAUTHORIZED` sin token.
- **Observaciones:** no valida en el backend que el usuario no tenga ya otra reserva activa; confirmado por el desarrollador que esto es intencional en el estado actual del proyecto — el sistema sí permite varias reservas activas simultáneas por usuario (ver `INFORMATION_GAPS.md` GAP-10, resuelto).

### PUT /api/reservations/:id
- **Descripción:** reprograma (edita) una reserva propia existente.
- **Controller/archivo origen:** `reservationsController.update` → `reservationsService.updateReservation` → `CALL web_up_update_reservation(?,?,?,?)`.
- **Request esperado:** param `id` (int); body `{ "seatId": number, "date": "YYYY-MM-DD" }` (misma validación que `POST`).
- **Response esperado:** `200 { success:true, data: { id, seatId, seatCode, date, userEmail } }`.
- **Autenticación:** Requerida.
- **Errores conocidos:** `400 VALIDATION_ERROR` (validación de body, o negocio: reserva inexistente, no pertenece al usuario, lugar no disponible); `401 UNAUTHORIZED` sin token.
- **Observaciones:** ninguna adicional.

### DELETE /api/reservations/:id
- **Descripción:** cancela (lógicamente) una reserva propia.
- **Controller/archivo origen:** `reservationsController.remove` → `reservationsService.deleteReservation` → `CALL web_de_cancel_reservation(?,?)`.
- **Request esperado:** param `id` (int). Sin body.
- **Response esperado:** `200 { success:true, data: { id } }`.
- **Autenticación:** Requerida.
- **Errores conocidos:** `400 VALIDATION_ERROR` (reserva inexistente o no pertenece al usuario, vía `BusinessError`); `401 UNAUTHORIZED` sin token.
- **Observaciones:** nunca hace `DELETE` físico en la base de datos — es un `UPDATE` que marca `is_active=false, is_deleted=true, deleted_at=NOW()`.

## Formas de datos (contrato fijo, documentado en los README del proyecto)

**Lugar (`seat`):**
```json
{ "id": 2, "code": "A2", "row": 1, "column": 2, "status": "disponible" }
```

**Reserva (`reservation`):**
```json
{ "id": 10, "seatId": 2, "seatCode": "A2", "date": "2026-09-01", "userEmail": "..." }
```

## Documentación formal de la API (Swagger/OpenAPI)

No se encontró ningún archivo `swagger.json`, `openapi.yaml`, ni configuración de `swagger-ui-express` en las dependencias del backend. La única documentación de la API es la tabla de endpoints en los README de `reserva-lugares-oficina-api` y raíz, y este archivo.

**Decisión confirmada (2026-09-10):** el desarrollador decidió **no implementar** Swagger/OpenAPI por ahora. Queda anotada únicamente como **mejora futura** a evaluar si el proyecto crece más allá de la actividad de capacitación actual — no es un pendiente crítico. Ver `INFORMATION_GAPS.md` (GAP-15, N/A — mejora futura no crítica).

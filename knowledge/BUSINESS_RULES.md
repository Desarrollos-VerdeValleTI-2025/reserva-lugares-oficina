# Reglas de Negocio — Reserva de Lugares de Oficina

Cada regla indica su origen: **Código**, **Contexto usuario**, **Configuración** o **No determinado**.

## Módulo: Autenticación

| ID | Regla | Origen |
|---|---|---|
| BR-01 | Todo acceso a `/api/*` y a `/health/secure` requiere un JWT válido emitido por el tenant de Azure AD configurado (firma, audiencia y emisor verificados). | Código (`authMiddleware.js`) |
| BR-02 | El identificador del usuario (`userEmail`) para cualquier operación de reserva se obtiene únicamente del claim del token (`preferred_username`/`upn`/`unique_name`/`email`); nunca de query, body o params enviados por el cliente. | Código (`authMiddleware.js`, `reservationsController.js`) + Contexto usuario (confirma explícitamente este comportamiento) |

## Módulo: Disponibilidad de asientos

| ID | Regla | Origen |
|---|---|---|
| BR-03 | Un lugar está disponible en una fecha si no existe ninguna reserva con `is_active=TRUE` e `is_deleted=FALSE` para ese `id_seat` y esa fecha. | Código (`fn_seat_is_available.sql`) |
| BR-04 | El grid de disponibilidad siempre contempla los 20 lugares fijos definidos en `dbo_seats` (5 filas × 4 columnas, códigos A1–E4). | Código (`03_insert_dbo_seats.sql`, `web_se_seats_bydate.sql`) |

## Módulo: Creación de reserva

| ID | Regla | Origen |
|---|---|---|
| BR-05 | No se permite crear una reserva con fecha anterior a hoy (`p_date < CURDATE()` → error). | Código (`web_in_create_reservation.sql`); reforzado en UI (`ReservarLugar.jsx`, `disabledDate`) |
| BR-06 | No se permiten parámetros nulos (`seatId`, `date`, `userEmail`) al crear una reserva. | Código (`web_in_create_reservation.sql`, `reservationValidators.js`) |
| BR-07 | `seatId` debe ser un número entero; `date` debe tener formato ISO8601 (`YYYY-MM-DD`). | Código (`reservationValidators.js`) |
| BR-08 | No se puede crear una reserva para un lugar que no está disponible en la fecha indicada (ver BR-03). | Código (`web_in_create_reservation.sql`) |

## Módulo: Edición de reserva

| ID | Regla | Origen |
|---|---|---|
| BR-09 | Solo el usuario dueño de la reserva (su `user_email` debe coincidir con el del token) puede editarla; si no coincide, se rechaza. | Código (`web_up_update_reservation.sql`) |
| BR-10 | Al editar, se valida la disponibilidad del nuevo lugar/fecha desactivando temporalmente (dentro de la misma transacción) la reserva actual, para no autobloquear la validación de disponibilidad; se revierte todo si algo falla. | Código (`web_up_update_reservation.sql`) |
| BR-11 | Solo se puede editar una reserva que exista, esté activa y no eliminada. | Código (`web_up_update_reservation.sql`) |

## Módulo: Cancelación de reserva

| ID | Regla | Origen |
|---|---|---|
| BR-12 | La cancelación de una reserva es **lógica** (`is_active=false`, `is_deleted=true`, `deleted_at=NOW()`); nunca se hace un `DELETE` físico sobre el registro. | Contexto usuario (declarado explícitamente) + Código (`web_de_cancel_reservation.sql`, `dbo_reservations`) |
| BR-13 | Solo el usuario dueño de la reserva puede cancelarla. | Código (`web_de_cancel_reservation.sql`) |
| BR-14 | Cancelar una reserva libera el lugar/fecha para que pueda volver a reservarse (no hay `UNIQUE(id_seat, reservation_date)` a propósito). | Código (comentario en `04_create_dbo_reservations.sql`, README de la BD) |

## Módulo: Consulta de reservas

| ID | Regla | Origen |
|---|---|---|
| BR-15 | El listado de "mis reservas" solo incluye reservas activas, no eliminadas y con `reservation_date >= CURDATE()` (fecha futura o de hoy). | Código (`web_se_reservations_byuser.sql`) |
| BR-17 | Un usuario **puede tener más de una reserva activa simultánea**, en fechas distintas: el sistema no restringe al usuario a una sola reserva activa. Esta ausencia de restricción es el comportamiento actual **confirmado**, no una omisión pendiente de resolver. La interfaz ("Mis reservas") actualmente solo muestra la primera reserva devuelta por el backend (`reservations[0]`) — esto es una limitación conocida de la UI, documentada en `FRONTEND.md`, no una regla de negocio de "una reserva por usuario". | Contexto usuario (aclaración explícita del desarrollador, 2026-09-10) + Código (`web_in_create_reservation.sql` no valida duplicidad; `web_se_reservations_byuser.sql` puede devolver varias filas) |

## Módulo: Contrato de API

| ID | Regla | Origen |
|---|---|---|
| BR-16 | El contrato de datos de la API (rutas, forma de los objetos `seat`/`reservation`, formato de respuesta `{success,data}`/`{success,error}`) está fijo desde las primeras iteraciones del proyecto y no ha cambiado. | Contexto usuario (declarado explícitamente) + Código (confirmado en todos los controllers/middlewares) + Configuración (README de los 3 componentes lo documentan igual) |

## Reglas no determinadas / en revisión

| ID | Descripción | Origen |
|---|---|---|
| BR-18 | No se determinaron reglas adicionales de negocio como: horario de oficina, aforo máximo por día distinto a 20 lugares, límite de anticipación máxima para reservar, o reservas recurrentes. | No determinado |

> Nota: BR-17 (multiplicidad de reservas por usuario) ya no aparece en esta sección de "no determinadas" — se movió al módulo "Consulta de reservas" arriba, como regla confirmada por el desarrollador el 2026-09-10. Ver `INFORMATION_GAPS.md` (GAP-10, resuelto).

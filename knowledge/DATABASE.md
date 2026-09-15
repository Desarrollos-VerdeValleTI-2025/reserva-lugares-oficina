# Base de datos — Reserva de Lugares de Oficina

## Existencia y motor

Sí existe base de datos propia: **MySQL** (README indica versión 9.7 o LTS vigente), base de datos `reservalugares`, `CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`, tablas con `engine = InnoDB`. *(Origen: `reserva-lugares-oficina-db/scripts/01_create_database.sql`, `02_create_dbo_seats.sql`, `04_create_dbo_reservations.sql`, README de `reserva-lugares-oficina-db`.)*

Todo el acceso desde el backend se hace vía **stored procedures y una función**, nunca `SELECT`/`INSERT`/`UPDATE` directo desde Node sobre las tablas (confirmado en `reservationsService.js` / `seatsService.js`, que solo ejecutan `CALL ...`).

## 4.1 Modelo de datos

Dos entidades principales, relación 1:N (`dbo_seats` 1 — N `dbo_reservations`):

```
dbo_seats (1) ──────< (N) dbo_reservations
   id  PK                    id            PK
   code UNIQUE                id_seat       FK -> dbo_seats.id
   seat_row                   reservation_date
   seat_column                user_email
   is_active/is_deleted/...   is_active/is_deleted/deleted_at/...
```

No existe una tabla de usuarios propia: el usuario se identifica únicamente por `user_email` (string), obtenido del token de Azure AD — no hay `dbo_users` ni FK hacia una tabla de identidad. *(Origen: código — `04_create_dbo_reservations.sql`, README de la BD: "identificador del usuario (viene del token de Azure AD, no hay tabla de usuarios propia)".)*

## 4.2 Tablas / colecciones clave

| Entidad | Descripción | Columnas relevantes | Fuente |
|---|---|---|---|
| `dbo_seats` | Los 20 lugares físicos fijos de la oficina (nunca cambian) | `id` (PK, autoincrement), `code` (VARCHAR(10), UNIQUE, ej. "A1"), `seat_row` (INT), `seat_column` (INT), `is_active`, `is_deleted`, `created_at`, `updated_at`, `deleted_at` | `02_create_dbo_seats.sql`, `03_insert_dbo_seats.sql` |
| `dbo_reservations` | Las reservas hechas por los usuarios | `id` (PK, autoincrement), `id_seat` (FK → `dbo_seats.id`), `reservation_date` (DATE), `user_email` (VARCHAR(128)), `is_active`, `is_deleted`, `created_at`, `updated_at`, `deleted_at` | `04_create_dbo_reservations.sql` |

Datos semilla: `03_insert_dbo_seats.sql` inserta exactamente 20 lugares (`A1`–`A4`, `B1`–`B4`, `C1`–`C4`, `D1`–`D4`, `E1`–`E4`; 5 filas × 4 columnas).

## 4.3 Reglas de integridad

- **Llave primaria:** `id` autoincremental en ambas tablas.
- **Llave foránea:** `dbo_reservations.id_seat → dbo_seats.id`.
- **Unicidad:** `dbo_seats.code` es `UNIQUE`. **No** existe `UNIQUE(id_seat, reservation_date)` en `dbo_reservations` — decisión explícita documentada en el propio script (comentario: *"No se usa UNIQUE... porque la cancelación es lógica... cancelar y volver a reservar el mismo lugar/fecha debe ser posible"*).
- **Índices:** `idx_dbo_reservations_id_seat_reservation_date` (sobre `id_seat, reservation_date`) e `idx_dbo_reservations_user_email` (sobre `user_email`), ambos creados en `05_create_indexes.sql` para optimizar las consultas de disponibilidad y de "mis reservas".
- **Validaciones de negocio implementadas en la base de datos** (funciones/SPs, con `SIGNAL SQLSTATE '45000'` para rechazar operaciones inválidas):
  - `fn_seat_is_available(seat_id, date)`: retorna `FALSE` si hay una reserva activa y no eliminada para ese lugar/fecha (o si algún parámetro es `NULL`).
  - `web_in_create_reservation`: rechaza parámetros nulos, fechas pasadas (`< CURDATE()`) y lugares no disponibles.
  - `web_up_update_reservation`: rechaza parámetros nulos, reservas inexistentes/inactivas, reservas que no pertenecen al `user_email` indicado, y lugares/fechas nuevos no disponibles (validado desactivando temporalmente la reserva actual dentro de la misma transacción, para no autobloquearse).
  - `web_de_cancel_reservation`: rechaza parámetros nulos, reservas inexistentes/inactivas, y reservas que no pertenecen al `user_email` indicado.
  - Todos los SPs de escritura usan `START TRANSACTION` / `COMMIT`, con `DECLARE EXIT HANDLER FOR SQLEXCEPTION` que hace `ROLLBACK` + `RESIGNAL` ante cualquier error SQL.
- **Confirmado por el desarrollador (2026-09-10):** no existe ninguna restricción (constraint, trigger o validación en SP) que impida que un mismo `user_email` tenga más de una reserva activa simultánea en fechas distintas — y esto es el **comportamiento actual confirmado**, no una brecha ni un bug: el sistema no limita al usuario a una sola reserva activa, simplemente esa restricción no está implementada todavía en esta versión. Ver `INFORMATION_GAPS.md` (GAP-10, resuelto) y `BUSINESS_RULES.md` (BR-17).

## 4.4 Backup y mantenimiento

**N/A (confirmado por el desarrollador, 2026-09-10).** No existe backup ni mantenimiento de la base de datos por el momento. Esto ya no es un hueco de información pendiente de investigar: el desarrollador confirmó explícitamente que no aplica para el alcance actual del proyecto (capacitación, sin datos reales de producción).

| Aspecto | Detalle |
|---|---|
| Frecuencia de backup | N/A para esta versión del proyecto (confirmado por el desarrollador). |
| Herramienta / destino | N/A para esta versión del proyecto (confirmado por el desarrollador). |
| Retención | N/A para esta versión del proyecto (confirmado por el desarrollador). |
| Procedimiento de restauración | N/A para esta versión del proyecto (confirmado por el desarrollador). |

Si el sistema llegara a manejar datos reales en el futuro, esta sección debería revisarse y dejar de ser N/A. Ver `INFORMATION_GAPS.md` (GAP-07, N/A).

## Objetos de base de datos (funciones y stored procedures)

| Objeto | Tipo | Qué hace | Script |
|---|---|---|---|
| `fn_seat_is_available` | Función | Disponibilidad de un lugar/fecha | `06_fn_seat_is_available.sql` |
| `web_se_seats_bydate` | Stored Procedure | Grid de 20 lugares + estado para una fecha (`LEFT JOIN` contra reservas activas de esa fecha) | `07_web_se_seats_bydate.sql` |
| `web_in_create_reservation` | Stored Procedure | Crea una reserva (valida nulos, fecha, disponibilidad) | `08_web_in_create_reservation.sql` |
| `web_up_update_reservation` | Stored Procedure | Reprograma una reserva propia | `09_web_up_update_reservation.sql` |
| `web_de_cancel_reservation` | Stored Procedure | Cancela lógicamente una reserva propia | `10_web_de_cancel_reservation.sql` |
| `web_se_reservations_byuser` | Stored Procedure | Reservas activas y futuras (`reservation_date >= CURDATE()`) de un usuario | `11_web_se_reservations_byuser.sql` |

## Usuario de aplicación y permisos — diseño confirmado (antes reportado como contradicción)

El `README.md` de `reserva-lugares-oficina-db` documenta un procedimiento de mínimo privilegio: crear un **rol** `rol_reservas_api` con **únicamente** permiso `EXECUTE` sobre `reservalugares.*`, y asignarlo al usuario `app_reservas_api`:

```sql
CREATE ROLE IF NOT EXISTS 'rol_reservas_api';
GRANT EXECUTE ON reservalugares.* TO 'rol_reservas_api';
CREATE USER 'app_reservas_api'@'localhost' IDENTIFIED BY '<una_contraseña_de_16+_caracteres>';
GRANT 'rol_reservas_api' TO 'app_reservas_api'@'localhost';
```

El script **realmente versionado y ejecutable** `01_create_database.sql` hace algo distinto:

```sql
CREATE USER IF NOT EXISTS 'app_reservas_api'@'localhost' IDENTIFIED BY '<contraseña, ya rotada>';
GRANT SELECT, INSERT, UPDATE, EXECUTE ON reservalugares.* TO 'app_reservas_api'@'localhost';
```

**Estado (confirmado por el desarrollador, 2026-09-10 — Resuelto):** esta diferencia con el README **no** es una contradicción sin resolver. El desarrollador aclaró que los permisos amplios (`SELECT, INSERT, UPDATE, EXECUTE`) del script fueron **intencionales**, con el propósito de crear el usuario de aplicación dentro de la base de datos durante el despliegue; ya se ejecutó así en el entorno real. Es el diseño confirmado del proyecto en su estado actual.

Sobre la contraseña que aparecía en texto plano en el script: ya fue **rotada** por el equipo (ver `SECURITY.md`, GAP-04).

Nota menor (no bloqueante, fuera del alcance de este agente): el `README.md` de `reserva-lugares-oficina-db` podría actualizarse en algún momento para reflejar que el usuario de aplicación se crea con estos permisos directos y no únicamente vía el rol `rol_reservas_api` de solo `EXECUTE`, para evitar que un desarrollador nuevo lea ambos documentos y perciba una discrepancia. Ver `SECURITY.md` y `RISKS.md` (R2).

## Estrategia de particionamiento / escalabilidad

No fue posible determinar esta información — no hay evidencia de particionamiento, réplicas de lectura, ni pooling más allá del `connectionLimit: 10` configurado en `mysql2/promise`.

# reserva-lugares-oficina-db

Base de datos MySQL real del proyecto (`reservalugares`), construida siguiendo el Estándar de Desarrollo de Bases de Datos con MySQL de Verde Valle. Toda la lógica de negocio (validaciones, disponibilidad, transacciones) vive en funciones y stored procedures — el backend (`reserva-lugares-oficina-api`) nunca toca las tablas directo, solo invoca estos objetos.

Proyecto simulado para capacitación, sin conexión con sistemas en producción.

## Requisitos

- MySQL 9.7 (o la versión LTS vigente) corriendo localmente.
- Un cliente para ejecutar los scripts (MySQL Workbench, o `mysql` por línea de comandos).

## Cómo crear la base de datos en local

Los scripts están numerados y deben ejecutarse **en ese orden**, uno por uno (`File → Open SQL Script` en Workbench → ejecutar todo el script con `Ctrl+Shift+Enter`, no una selección parcial):

```
scripts/
├── 01_create_database.sql              # CREATE DATABASE reservalugares (utf8mb4)
├── 02_create_dbo_seats.sql              # Tabla de los 20 lugares fijos
├── 03_insert_dbo_seats.sql              # Inserta los 20 lugares (5 filas A-E x 4 columnas)
├── 04_create_dbo_reservations.sql       # Tabla de reservas (FK a dbo_seats)
├── 05_create_indexes.sql                # Índices sobre dbo_reservations
├── 06_fn_seat_is_available.sql          # Función: ¿está disponible un lugar/fecha?
├── 07_web_se_seats_bydate.sql           # SP: grid de lugares con su estado para una fecha
├── 08_web_in_create_reservation.sql     # SP: crea una reserva (valida fecha y disponibilidad)
├── 09_web_up_update_reservation.sql     # SP: reprograma una reserva propia
├── 10_web_de_cancel_reservation.sql     # SP: cancela una reserva propia (cancelación lógica)
└── 11_web_se_reservations_byuser.sql    # SP: reservas activas y futuras de un usuario
```

Después de correr todo, crea el usuario de aplicación acotado que usa el backend (nunca uses tu cuenta root/personal desde el API):

```sql
CREATE ROLE IF NOT EXISTS 'rol_reservas_api';
GRANT EXECUTE ON reservalugares.* TO 'rol_reservas_api';

CREATE USER 'app_reservas_api'@'localhost'
IDENTIFIED BY '<una_contraseña_de_16+_caracteres>';

GRANT 'rol_reservas_api' TO 'app_reservas_api'@'localhost';
SET DEFAULT ROLE 'rol_reservas_api' TO 'app_reservas_api'@'localhost';
```

Esta cuenta solo tiene permiso `EXECUTE` — no puede hacer `SELECT`/`INSERT`/`UPDATE` directo sobre las tablas, a propósito (principio de mínimo privilegio: toda la lógica pasa por los stored procedures).

## Esquema

**`dbo_seats`** — los 20 lugares fijos, nunca cambian.

| Columna | Tipo | Nota |
|---|---|---|
| id | INT (PK) | |
| code | VARCHAR(4) | único, ej. "A1" |
| seat_row | INT | 1-5 |
| seat_column | INT | 1-4 |
| is_active, is_deleted, created_at, updated_at, deleted_at | — | campos base de auditoría |

**`dbo_reservations`** — las reservas de los usuarios.

| Columna | Tipo | Nota |
|---|---|---|
| id | INT (PK) | |
| id_seat | INT (FK → dbo_seats.id) | |
| reservation_date | DATE | |
| user_email | VARCHAR(128) | identificador del usuario (viene del token de Azure AD, no hay tabla de usuarios propia) |
| is_active, is_deleted, created_at, updated_at, deleted_at | — | ver nota abajo |

**Nota sobre cancelación**: al cancelar una reserva (`web_de_cancel_reservation`), se marca `is_active = FALSE`, `is_deleted = TRUE` y `deleted_at = NOW()` — sigue siendo un `UPDATE`, el registro **nunca se borra** (por eso no hay `UNIQUE(id_seat, reservation_date)`: cancelar y volver a reservar el mismo lugar/fecha debe ser posible).

## Objetos y su propósito

| Objeto | Tipo | Qué hace |
|---|---|---|
| `fn_seat_is_available` | Función | Devuelve si un lugar está disponible en una fecha (sin reserva activa). Reutilizada por `create` y `update`, no se duplica la validación. |
| `web_se_seats_bydate` | SP | Grid completo de 20 lugares + su estado, vía `LEFT JOIN` contra reservas de esa fecha. |
| `web_in_create_reservation` | SP | Valida parámetros, fecha no pasada y disponibilidad; inserta con transacción y `SIGNAL`/`RESIGNAL` en error. |
| `web_up_update_reservation` | SP | Valida pertenencia; para checar disponibilidad del nuevo lugar/fecha sin bloquearse a sí misma, desactiva temporalmente la reserva actual dentro de la transacción antes de preguntar (revertido automático si algo falla). |
| `web_de_cancel_reservation` | SP | Valida pertenencia y cancela (lógicamente) la reserva. |
| `web_se_reservations_byuser` | SP | Reservas activas y futuras (`reservation_date >= hoy`) de un usuario. |

## Probar los SPs directamente

Antes de conectar el API, cada uno se puede probar con `CALL`:

```sql
CALL web_se_seats_bydate('2026-09-01');
CALL web_in_create_reservation(1, '2099-01-01', 'prueba@verdevalle.com');
CALL web_se_reservations_byuser('prueba@verdevalle.com');
CALL web_up_update_reservation(<id>, 5, '2099-02-01', 'prueba@verdevalle.com');
CALL web_de_cancel_reservation(<id>, 'prueba@verdevalle.com');
```

## Responsable

PracticanteDesarrolloVV (practicantedes@verdevalle.com)

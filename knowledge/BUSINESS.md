# Negocio — Reserva de Lugares de Oficina

## Objetivo de negocio

Permitir a los empleados de Verde Valle reservar un lugar/asiento físico en la oficina para un día específico. *(Origen: contexto proporcionado por el usuario, consistente con la descripción del `README.md` raíz del repositorio: "Aplicación para reservar lugares de trabajo en una oficina").*

## Problema que resuelve

Evita conflictos de asignación de espacios físicos de oficina y da visibilidad de disponibilidad por fecha. *(Origen: contexto proporcionado por el usuario.)*

Nota de alcance: los README del propio repositorio aclaran que se trata de un **proyecto simulado para fines de capacitación** de un practicante de desarrollo de Verde Valle, sin conexión con sistemas de producción reales de la empresa. *(Origen: código / archivos de configuración — `README.md` raíz, `reserva-lugares-oficina-front/README.md`, `reserva-lugares-oficina-api/README.md`, `reserva-lugares-oficina-db/README.md`, todos incluyen la frase "Proyecto simulado para capacitación, sin conexión con sistemas en producción".)*

## Usuarios / áreas involucradas

- Empleados de Verde Valle que necesitan reservar un lugar de trabajo en la oficina. *(Origen: contexto proporcionado por el usuario.)*
- No se identifican roles diferenciados (ej. administrador de espacios, RH, facilities): cualquier cuenta corporativa autenticada tiene el mismo nivel de acceso funcional. *(Origen: código — no existe tabla de usuarios ni verificación de rol en `authMiddleware.js` ni en los controllers.)*

## Flujo funcional completo

1. El usuario abre la aplicación web y ve una pantalla de login si no tiene sesión iniciada (`PantallaLogin` en `App.jsx`).
2. Inicia sesión con su cuenta corporativa de Verde Valle vía Azure AD (MSAL, `loginRedirect`).
3. Una vez autenticado, la app carga automáticamente "Mis reservas" (`Inicio.jsx`, `GET /api/reservations/me`).
4. Si el usuario ya tiene una reserva activa y futura, ve una tarjeta con lugar y fecha, y tres acciones: **Ver lugar** (modal de solo lectura con el mapa de asientos), **Editar** (navega a la pantalla de reserva con los datos precargados) y **Cancelar** (confirmación → cancelación lógica).
5. Si no tiene reserva, ve un estado vacío con el botón **Apartar lugar**, que navega a la pantalla de reserva.
6. En la pantalla de reserva (`ReservarLugar.jsx`), el usuario elige una fecha (no puede elegir fechas pasadas) y el sistema consulta la disponibilidad de los 20 lugares para esa fecha (`GET /api/seats?date=`).
7. El usuario selecciona un lugar disponible en el mapa y confirma — se crea (`POST /api/reservations`) o se actualiza (`PUT /api/reservations/:id`) la reserva, según si venía del flujo de edición o de creación.
8. El usuario regresa a "Mis reservas", donde ve el resultado actualizado.

*(Origen: código — `App.jsx`, `Inicio.jsx`, `ReservarLugar.jsx`, `SeatMap.jsx`; y contexto proporcionado por el usuario, que coincide con lo observado en el código.)*

## Casos de uso

| Caso de uso | Disparador | Resultado |
|---|---|---|
| Consultar disponibilidad de asientos por fecha | Usuario abre "Reservar lugar" o cambia la fecha en el DatePicker | Grid de 20 lugares con estado "disponible"/"ocupado" para esa fecha |
| Crear reserva | Usuario selecciona un lugar disponible y confirma (sin reserva previa) | Nueva reserva activa asociada a su email |
| Ver reserva activa | Usuario entra a "Mis reservas" o hace clic en "Ver lugar" | Tarjeta con lugar/fecha, o modal con el mapa en modo lectura |
| Editar reserva | Usuario con reserva activa hace clic en "Editar" | Reserva actualizada (nuevo lugar y/o fecha), validando disponibilidad y pertenencia |
| Cancelar reserva | Usuario con reserva activa hace clic en "Cancelar" y confirma | Reserva marcada como cancelada (`is_active=false`), lugar vuelve a estar disponible |
| Listar mis reservas | Carga inicial de "Mis reservas" | Lista de reservas activas y futuras del usuario autenticado |

## Módulos funcionales

1. **Autenticación** — login/logout vía Azure AD (MSAL).
2. **Disponibilidad de asientos** — consulta de grid de 20 lugares por fecha.
3. **Gestión de reservas** — crear, editar, cancelar, listar reservas propias.

## Reglas funcionales (resumen; detalle completo con evidencia en `BUSINESS_RULES.md`)

- La cancelación de una reserva es **lógica** (`is_active=false`), nunca un `DELETE` físico. *(Origen: contexto proporcionado por el usuario y código — `web_de_cancel_reservation.sql`.)*
- El contrato de datos de la API (rutas y formato de respuesta `{success,data}` / `{success,error}`) se fijó desde las primeras iteraciones del proyecto y no ha cambiado. *(Origen: contexto proporcionado por el usuario, confirmado en código y en los tres README del repositorio.)*
- No se puede reservar en una fecha ya pasada. *(Origen: código — `web_in_create_reservation.sql`, reforzado en UI por `ReservarLugar.jsx`.)*
- Solo el dueño de una reserva (identificado por el email del token) puede editarla o cancelarla. *(Origen: código — `web_up_update_reservation.sql`, `web_de_cancel_reservation.sql`.)*

## Conceptos de negocio

Ver `GLOSSARY.md` para definiciones detalladas de términos como "lugar/asiento", "reserva activa", "cancelación lógica", "grid de disponibilidad".

## Información pendiente o ambigua (a validar)

- **Resuelto (2026-09-10):** se confirmó con el desarrollador que el sistema **no** limita al usuario a una sola reserva activa — puede tener más de una reserva en fechas distintas; esa restricción simplemente no está implementada todavía. No es una ambigüedad, es el comportamiento actual válido. El frontend solo muestra la primera reserva devuelta (`reservations[0]`), lo cual queda documentado como limitación de la interfaz, no como regla de negocio. Ver `INFORMATION_GAPS.md` (GAP-10, resuelto) y `BUSINESS_RULES.md` (BR-17).
- No se determinó si existen políticas de negocio adicionales no reflejadas en código, por ejemplo: límite de anticipación máxima para reservar, horario de oficina, aforo por día, o reservas recurrentes. No hay evidencia de estas reglas ni en código ni en el contexto proporcionado por el usuario.

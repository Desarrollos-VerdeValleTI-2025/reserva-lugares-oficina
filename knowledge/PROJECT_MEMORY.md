# Project Memory — Reserva de Lugares de Oficina

> Pega este archivo como contexto inicial en futuras conversaciones con IA sobre este proyecto, junto con los archivos específicos que necesites (`ARCHITECTURE.md`, `API.md`, etc.).

## Qué hace el sistema

Permite a los empleados de Verde Valle reservar un lugar físico de trabajo (asiento) en la oficina para una fecha específica: consultar disponibilidad, crear una reserva, editarla (cambiar lugar/fecha) o cancelarla, y ver su reserva activa. Login obligatorio con cuenta corporativa (Azure AD / Microsoft Entra ID).

## Para qué existe

Evitar conflictos de asignación de espacios físicos de oficina y dar visibilidad de disponibilidad por fecha (contexto proporcionado por el usuario). Es un **proyecto simulado de capacitación** para un practicante de desarrollo de Verde Valle, construido en 4 actividades incrementales (front dummy → API en memoria → BD real aislada → integración completa), según lo indican los README del propio repositorio. No tiene conexión con sistemas de producción reales de la empresa.

## Cómo está organizado (monorepo, 3 carpetas hermanas, un solo `.git`)

```
reserva-lugares-oficina/                  <- ROOT_ABS_PATH
├── reserva-lugares-oficina-front/        React 19 + Vite + Ant Design + MSAL (puerto 5173)
├── reserva-lugares-oficina-api/          Node.js + Express (CommonJS) (puerto 4000)
└── reserva-lugares-oficina-db/           Scripts SQL numerados para MySQL (`reservalugares`)
```

Arquitectura: SPA (front) → API REST interna (backend) → MySQL (a través de stored procedures, nunca SQL directo sobre tablas). Autenticación end-to-end con Azure AD/MSAL usando **dos App Registrations distintos** (uno para el front SPA, otro para el API con scope `API.Access`).

## Módulos principales

1. Consulta de disponibilidad de asientos por fecha (`GET /api/seats`).
2. Creación de reserva (`POST /api/reservations`).
3. Edición de reserva (`PUT /api/reservations/:id`).
4. Cancelación de reserva — **siempre lógica**, nunca `DELETE` físico (`DELETE /api/reservations/:id` → `is_active=false`).
5. Listado de "mis reservas" (`GET /api/reservations/me`).

## Reglas clave que no deben olvidarse

- El contrato de datos de la API (rutas, forma de los objetos, formato `{success,data}` / `{success,error}`) está **fijo desde la primera iteración** del proyecto — no se modifica sin que el usuario lo pida explícitamente.
- La cancelación de reservas **siempre** es lógica (`is_active=false`, `is_deleted=true`, `deleted_at=NOW()`); nunca se hace `DELETE` físico. Ver `dbo_reservations` / `web_de_cancel_reservation`.
- El `userEmail` de cada operación se obtiene **únicamente** del claim del JWT de Azure AD (`req.user.email` en el backend) — nunca de query/body/params.
- Toda la lógica de negocio de reservas vive en **stored procedures MySQL**; el backend nunca hace `SELECT`/`INSERT`/`UPDATE` directo sobre `dbo_seats`/`dbo_reservations`, solo `CALL sp(...)`.
- No hay tabla de usuarios propia ni control de roles: cualquier cuenta autenticada de Verde Valle tiene el mismo acceso a todas las operaciones.

## Decisiones relevantes (ver detalle y evidencia en DECISIONS.md)

- Auth delegada 100% a Azure AD/MSAL con dos App Registrations, en vez de JWT propio.
- Lógica de negocio en stored procedures, no en el backend Node.
- Cancelación lógica (soft delete) en vez de borrado físico.
- Caché de MSAL en `sessionStorage`, nunca `localStorage`.

## Riesgos conocidos (ver detalle en RISKS.md)

**Actualización 2026-09-10 — el desarrollador respondió la mayoría de estos puntos; se conservan aquí con su estado real:**

- **Mitigado:** la contraseña de base de datos que estaba hardcodeada en texto plano en `reserva-lugares-oficina-db/scripts/01_create_database.sql` (script versionado en git) ya fue **rotada** por el equipo. El valor anterior sigue en el historial de git pero ya no es válido.
- **Resuelto (no era contradicción):** el permiso `SELECT, INSERT, UPDATE, EXECUTE` otorgado en `01_create_database.sql` al usuario de aplicación fue **intencional**, para crearlo durante el despliegue — confirmado por el desarrollador, no un error respecto al README de la BD.
- **Aceptado (decisión de alcance):** no se encontró ningún tipo de prueba automatizada — confirmado que no se hicieron por ser una aplicación de capacitación.
- **Aceptado (decisión de alcance):** no hay CI/CD ni Docker — confirmado que el despliegue es **manual, vía Nginx**, y no está planeado automatizar por ahora.
- **Resuelto (2026-09-10):** el `console.log('DEBUG jwt.verify error ->', ...)` de `authMiddleware.js` ya fue reemplazado en código por `logger.debug(...)` (winston), condicionado por nivel de ambiente. Confirmado por lectura directa del archivo. Ya no es un riesgo activo.
- **Resuelto (comportamiento confirmado, no un bug):** no hay constraint a nivel de base de datos que limite a "una reserva activa por usuario" — el desarrollador confirmó que el sistema **sí permite** varias reservas activas simultáneas en fechas distintas; esa restricción simplemente no está implementada. La UI (`reservations[0]`) queda como limitación conocida de interfaz, no como regla de negocio.
- **Aceptado (decisión de alcance):** no hay roles/permisos granulares, backup documentado de MySQL, ni monitoreo/observabilidad más allá de logs locales de Winston/Morgan — todos confirmados por el desarrollador como fuera de alcance para esta etapa del proyecto.
- **Mitigado (2026-09-10):** rate limiting (R8) y rotación de logs (R9) ya fueron implementados en código y verificados por lectura directa. `app.js` monta `apiLimiter` (`express-rate-limit`, 300 solicitudes/15 min por IP) sobre `/api` antes del `authMiddleware`; `config/logger.js` usa `winston-daily-rotate-file` (`DailyRotateFile`, `maxSize: '20m'`, `maxFiles: '14d'`) para `logs/error-%DATE%.log` y `logs/combined-%DATE%.log`.
- **Mitigado (2026-09-10, cuarta pasada):** R11 (versiones mayores recientes de dependencias) — el desarrollador corrió `npm outdated`/`npm update` en front y api, actualizando todo dentro de las mismas mayores ya en uso (react/react-dom `19.3.0`, react-router-dom `7.18.3`, antd `6.6.3`, vite `8.3.0`, eslint `10.10.0`, mysql2 `3.24.4`). Confirmado que la API responde (`/health` 200) y el front compila (`npm run build`). El riesgo de fondo (estar en mayores recientes) se mantiene como aceptado, no como pendiente.
- **Resuelto (2026-09-10, cuarta pasada):** R15 (sin SemVer) — el front actualizó `"version"` de `0.0.0` a `1.0.0` en su `package.json`, igual que la API.
- **Resuelto (2026-09-10, cuarta pasada, nuevo hallazgo R16):** error real de ESLint (`react-hooks/set-state-in-effect`) en `src/pages/Inicio.jsx` (preexistente, no causado por la actualización de dependencias) — ya corregido moviendo la lógica async a una IIFE dentro del `useEffect`; `npm run lint` queda sin errores. Ver `RISKS.md` y `FRONTEND.md`.
- **Con esta cuarta pasada, no queda ningún riesgo en `RISKS.md` en estado "Pendiente" (todos son Mitigado, Resuelto o Aceptado por decisión de alcance).**

## Información que NO debe asumirse / inventarse

- No asumir que el proyecto avanzará hacia CI/CD, Docker, pruebas automatizadas, monitoreo, backups o roles/permisos granulares sin una decisión explícita futura — actualmente están confirmados como fuera de alcance para esta versión (proyecto de capacitación), no en desarrollo.
- No asumir que la contraseña que aparece en el historial de git (`01_create_database.sql`) sigue siendo válida — fue rotada; tampoco reintroducir el patrón de hardcodear secretos en scripts versionados.
- No asumir que "una reserva por usuario" es o será una regla de negocio: está confirmado que el sistema permite varias reservas activas por usuario; si en el futuro se pide limitar a una, requiere una decisión de negocio explícita antes de implementarla.
- No asumir mecanismos de despliegue distintos a Nginx + proceso manual (nada de pipelines, contenedores, ni orquestadores) salvo instrucción explícita en contrario.

## Instrucciones para futuras IA que trabajen con este proyecto

1. Lee primero `knowledge/` completo (o al menos `PROJECT_MEMORY.md` + el archivo específico del área a modificar) antes de leer todo el código fuente de nuevo.
2. Respeta el contrato de datos de la API (`API.md`) salvo instrucción explícita en contrario.
3. Cualquier cambio a permisos de base de datos, manejo de la contraseña hardcodeada, o al middleware de autenticación debe tratarse como corrección de seguridad prioritaria, no como refactor opcional.
4. Sigue el Estándar JS de Verde Valle (convenciones de nombres, estructura de carpetas, seguridad obligatoria) para cualquier código nuevo en frontend o backend.
5. No agregues dependencias externas nuevas (frameworks CSS, librerías de estado, ORMs) sin verificar que sean compatibles con las decisiones ya tomadas (Ant Design como única librería de estilos, stored procedures como única vía de acceso a datos, MSAL como mecanismo de auth).
6. Actualiza `knowledge/CHANGELOG.md` y la sección afectada cuando se resuelva un punto de `INFORMATION_GAPS.md`.

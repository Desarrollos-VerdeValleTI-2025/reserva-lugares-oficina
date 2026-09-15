# Arquitectura — Reserva de Lugares de Oficina

## Estilo arquitectónico

Arquitectura **cliente-servidor de 3 capas**: SPA (frontend React) → API REST interna (backend Express) → Base de datos relacional propia (MySQL, accedida exclusivamente vía stored procedures). No es un monolito de un solo proceso (front y backend son procesos/despliegues separados), tampoco es microservicios (un único servicio backend), ni event-driven (no hay colas/brokers), ni un job/worker. *(Origen: código — estructura de carpetas en 3 proyectos independientes con su propio `package.json`/`README.md`, comunicación exclusivamente vía HTTP/REST desde el front, sin mensajería asíncrona.)*

La autenticación se delega completamente a un proveedor de identidad externo (Microsoft Entra ID / Azure AD vía MSAL), con el patrón "SPA + API protegida por OAuth2/OIDC, con audiencias separadas para front y backend". *(Origen: código — `msalConfig.js`, `authMiddleware.js`, README de front y de API.)*

## Componentes principales (propios del proyecto)

| Componente | Tipo | Responsabilidad | Archivos / Evidencia | ¿Es propio del proyecto? |
|---|---|---|---|---|
| `reserva-lugares-oficina-front` | Web SPA | Interfaz de usuario: login, mapa de asientos, gestión de "mi reserva" (crear/ver/editar/cancelar) | `src/App.jsx`, `src/pages/`, `src/components/SeatMap.jsx`, `src/api/` | Sí |
| `reserva-lugares-oficina-api` | API interna | Expone endpoints REST protegidos, valida entradas, orquesta llamadas a MySQL vía stored procedures | `src/app.js`, `src/routes/`, `src/controllers/`, `src/services/` | Sí |
| `reservalugares` (MySQL) | Base de datos propia | Persistencia de lugares y reservas; toda la lógica de disponibilidad/validación vive en funciones y stored procedures | `reserva-lugares-oficina-db/scripts/*.sql` | Sí |

No se documentan aquí tipos de componente sin evidencia real en el proyecto (worker/job, app móvil propia, librería interna compartida): no se usan en este proyecto y se omiten de la tabla para no generar ruido. Si en el futuro se agrega alguno de estos componentes, debe incorporarse a la tabla anterior con su evidencia correspondiente.

## Dependencias externas consumidas (no son componentes propios)

| Dependencia externa | Propósito | Detalle |
|---|---|---|
| Microsoft Entra ID / Azure AD (vía MSAL) | Proveedor de identidad — login SSO corporativo y emisión/validación de tokens | Ver `INTEGRATIONS.md` y `SECURITY.md` |

No se encontraron otras dependencias externas (sin SAP, Oracle, SuccessFactors, SharePoint, SMTP, storage externo, servicios REST/SOAP de terceros, colas o brokers).

## Servicios de identidad / autenticación

| Servicio | Rol |
|---|---|
| Microsoft Entra ID (Azure AD) | Emite y valida los tokens usados por el front (login) y por el backend (autorización de requests a `/api/*`). Dos App Registrations distintos: uno del front (SPA, login) y uno del API (expone el scope `API.Access`). |

## Fuentes de datos externas

No se encontraron fuentes de datos externas: la única base de datos es `reservalugares` (MySQL), propia del proyecto y descrita como componente propio arriba.

## Patrones, convenciones y decisiones de diseño (con evidencia)

| Nombre | Clasificación | Propósito | Evidencia en archivos | Nivel de confianza | Comentario |
|---|---|---|---|---|---|
| Capas Router → Controller → Service → DB | Patrón de capa | Separar el enrutamiento HTTP, la orquestación de la petición, la lógica de acceso a datos | `src/routes/*.js`, `src/controllers/*.js`, `src/services/*.js`, `src/db/connection.js` | Alta | Coincide con la estructura obligatoria del estándar interno de Verde Valle para backend Express. |
| Middleware de autenticación centralizado | Convención de framework (Express middleware) | Validar el JWT una sola vez para todas las rutas `/api/*`, en vez de repetirlo por controller | `src/app.js` (`app.use('/api', authMiddleware)`), `src/middlewares/authMiddleware.js` | Alta | Evita duplicar la verificación en cada controller. |
| Manejo de errores centralizado con clase de error de negocio | Patrón de diseño (Error Handler / excepción tipada) | Distinguir errores de negocio (mensaje seguro de exponer) de errores internos (mensaje genérico) | `src/middlewares/businessError.js`, `src/middlewares/errorHandler.js` | Alta | `BusinessError` marca `expose=true`; el resto de errores nunca exponen el stack trace. |
| Acceso a datos exclusivamente vía stored procedures (`CALL sp(...)`) | Decisión arquitectónica / convención institucional | Centralizar la lógica de negocio (validaciones, transacciones) en la base de datos; evitar SQL directo desde Node | `src/services/seatsService.js`, `src/services/reservationsService.js` (solo `pool.execute('CALL ...')`) | Alta | Confirmado también en los tres README del repositorio como decisión explícita. |
| Cancelación lógica (soft delete) | Patrón de diseño | Conservar histórico de reservas y permitir re-reservar el mismo lugar/fecha tras cancelar | `dbo_reservations` (`is_active`, `is_deleted`, `deleted_at`), `web_de_cancel_reservation.sql` | Alta | Explícitamente documentado en el README de la BD y confirmado por el usuario. |
| Instancia única (singleton) de MSAL | Patrón de diseño (Singleton) | Compartir una sola instancia de `PublicClientApplication` entre `main.jsx` y `httpClient.js` | `src/features/auth/msalInstance.js` | Alta | El propio comentario del archivo indica la intención explícita. |
| Interceptores HTTP en Axios | Patrón de diseño (Interceptor) | Inyectar el token de acceso en cada request y centralizar el manejo de errores 401/403 | `src/api/httpClient.js` | Alta | Único punto de consumo HTTP en todo el frontend (cumple el estándar interno "toda llamada HTTP pasa por `src/api/`"). |
| Hook personalizado de autenticación | Convención de framework (React Hooks) | Exponer `usuarioActual`, `iniciarSesion`, `cerrarSesion` de forma reutilizable | `src/features/auth/useAuth.js` | Alta | Envuelve `useMsal()` de `@azure/msal-react`. |
| Theming vía tokens de Ant Design | Convención de framework | Evitar colores/medidas hardcodeados, usar `ConfigProvider`/tokens | `src/main.jsx` (`ConfigProvider theme={{token:...}}`), uso de `theme.useToken()` en `SeatMap.jsx`, `App.jsx` | Alta | Alineado al estándar interno de Verde Valle para frontend. |

No se incluyen en esta tabla patrones "de manual" (ej. MVC clásico, Repository formal, CQRS) porque no hay evidencia de una implementación explícita de esos patrones como tales — la capa de acceso a datos son funciones sueltas por servicio, no clases repositorio.

## Diagramas técnicos

### A. Diagrama de arquitectura de alto nivel

```
┌───────────────────────┐        Login / Logout (redirect)
│ Empleado Verde Valle   │ ─────────────────────────────────────┐
└───────────┬───────────┘                                       │
            │ HTTPS                                              ▼
            │                                        ┌───────────────────────────┐
            ▼                                        │ Microsoft Entra ID (Azure  │
┌───────────────────────┐   Bearer token (API scope)  │ AD) — 2 App Registrations: │
│ Front (React + Vite)   │ ───────────────────────────▶│ Front (SPA) / API         │
│ localhost:5173         │◀─────────────────────────── │ (API.Access)              │
└───────────┬───────────┘   valida firma/aud/iss       └───────────────────────────┘
            │ HTTPS + JSON {success,data}/{success,error}          ▲
            ▼                                                       │ valida token
┌───────────────────────┐                                           │
│ API (Node.js/Express)  │───────────────────────────────────────────┘
│ localhost:4000          │
└───────────┬───────────┘
            │ CALL sp(...)  (mysql2/promise, nunca SQL directo sobre tablas)
            ▼
┌───────────────────────┐
│ MySQL — reservalugares │
│ dbo_seats / dbo_reservations
│ + funciones/SPs        │
└───────────────────────┘
```

### B. Diagrama de flujo funcional principal

```
Empleado inicia sesión (Azure AD)
   → Front consulta "mis reservas" (GET /api/reservations/me)
      → ¿Tiene reserva activa?
          Sí → muestra tarjeta (lugar, fecha) con opciones: Ver / Editar / Cancelar
          No → muestra botón "Apartar lugar"
   → Empleado elige fecha
      → Front consulta disponibilidad (GET /api/seats?date=)
      → Empleado selecciona un lugar disponible
      → Front confirma (POST /api/reservations  ó  PUT /api/reservations/:id)
   → API valida (Azure AD + reglas de negocio en stored procedures)
   → MySQL valida disponibilidad/fecha/pertenencia, inserta o actualiza
   → API responde {success:true, data:{...}}
   → Front regresa a "Mis reservas" con la información actualizada
```

### C. Diagrama de comunicación (secuencia simplificada — creación de reserva)

```
Front                     API (Express)                MySQL
 │  POST /api/reservations │                              │
 │  + Bearer token          │                              │
 ├─────────────────────────▶│                              │
 │                          │ authMiddleware: valida JWT   │
 │                          │ (Azure AD JWKS)               │
 │                          │ reservationValidators: valida │
 │                          │ seatId/date                   │
 │                          │ CALL web_in_create_reservation│
 │                          ├───────────────────────────────▶│
 │                          │                              │ valida fecha/disponibilidad
 │                          │                              │ INSERT + COMMIT (o SIGNAL)
 │                          │◀───────────────────────────────┤
 │                          │ mapea resultado a JSON        │
 │◀─────────────────────────┤ {success:true, data:{...}}    │
 │ actualiza UI              │                              │
```

Nota: el detalle interno de componentes React (providers, hooks, layouts, componentes visuales) **no se incluye aquí** — está documentado en `FRONTEND.md`, conforme a las reglas de este proyecto de documentación.

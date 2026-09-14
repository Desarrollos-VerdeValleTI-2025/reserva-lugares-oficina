# Frontend — Reserva de Lugares de Oficina

Este repositorio **sí contiene backend y base de datos propios** además del frontend (ver `BACKEND.md` y `DATABASE.md`); este archivo documenta exclusivamente `reserva-lugares-oficina-front`.

## Framework y librerías principales

| Librería | Versión (package.json) | Versión resuelta tras `npm update` 2026-09-10 | Uso |
|---|---|---|---|
| react / react-dom | ^19.2.8 | `19.3.0` | Framework UI |
| vite | ^8.2.2 | `8.3.0` | Build tool / dev server |
| @vitejs/plugin-react | ^6.1.0 | ^6.1.0 (sin cambio) | Integración de React con Vite |
| antd | ^6.6.1 | `6.6.3` | Librería de componentes UI y sistema de theming (única librería de estilos permitida por el estándar interno) |
| react-router-dom | ^7.18.2 | `7.18.3` | Ruteo SPA |
| dayjs | ^1.11.23 | sin cambio | Manejo de fechas |
| axios | ^1.20.0 | sin cambio | Cliente HTTP |
| @azure/msal-browser | ^5.21.0 | sin cambio | Cliente MSAL base |
| @azure/msal-react | ^5.7.0 | sin cambio | Bindings de MSAL para React (hooks, providers) |
| eslint + eslint-plugin-react-hooks + eslint-plugin-react-refresh | ^10.9.0 / ^7.1.1 / ^0.5.4 | eslint `10.10.0`; el resto sin cambio | Linting |

*(Origen: `reserva-lugares-oficina-front/package.json` y versiones resueltas en `package-lock.json`. El desarrollador actualizó todo dentro de las mismas versiones mayores ya en uso, sin saltar de mayor — ver `knowledge/RISKS.md` R11 y `knowledge/DEPENDENCIES.md`. También se actualizó `"version"` de `0.0.0` a `1.0.0` en este `package.json` — ver `RISKS.md` R15.)*

## Organización de carpetas

```
src/
├── api/                       # Consumo del API real — único punto de llamadas HTTP
│   ├── httpClient.js          # Instancia de axios: adjunta token, centraliza errores 401/403
│   ├── seats-api.js
│   └── reservations-api.js
├── features/
│   └── auth/
│       ├── msalConfig.js      # Configuración de MSAL (client id, tenant, scopes)
│       ├── msalInstance.js    # Instancia única (singleton) de MSAL
│       └── useAuth.js         # Hook: usuarioActual, iniciarSesion, cerrarSesion
├── components/
│   └── SeatMap.jsx            # Mapa de lugares reutilizable (modo lectura y modo selección)
├── pages/
│   ├── Inicio.jsx             # "Mis reservas": ver, editar, cancelar
│   └── ReservarLugar.jsx      # Selección de fecha y lugar (crear o editar)
├── assets/                    # hero.png, react.svg, vite.svg
├── App.jsx                    # Layout, rutas, guard de autenticación
└── main.jsx                   # Punto de entrada + MsalProvider + ConfigProvider (tema)
```

*(Origen: código — estructura real observada; coincide con la descrita en `reserva-lugares-oficina-front/README.md`.)*

## Rutas (React Router)

| Ruta | Componente | Protección |
|---|---|---|
| `/` | `Inicio.jsx` | Solo visible si `AuthenticatedTemplate` (MSAL) detecta sesión activa |
| `/reservar` | `ReservarLugar.jsx` | Igual que arriba |

No hay un componente `ProtectedRoute` explícito por ruta: la protección se hace a nivel global envolviendo todo el `<Layout>` autenticado con `<AuthenticatedTemplate>` / `<UnauthenticatedTemplate>` de `@azure/msal-react` en `App.jsx`. Si no hay sesión, se renderiza `PantallaLogin` en cualquier ruta.

## Pantallas

### PantallaLogin (definida dentro de `App.jsx`, no es un archivo de `pages/`)
- Propósito: permitir iniciar sesión con Azure AD.
- Contenido: título, texto explicativo, botón "Iniciar sesión" que llama a `iniciarSesion()` (de `useAuth`), el cual ejecuta `instance.loginRedirect(loginRequest)`.

### Inicio.jsx ("Mis reservas")
- Propósito: mostrar la reserva activa del usuario (si existe) y permitir verla, editarla o cancelarla; o mostrar un estado vacío con opción de crear una.
- Carga `GET /api/reservations/me` al montar (`useEffect`). **Corrección 2026-09-10 (R16 en `RISKS.md`, Resuelto):** originalmente el `useEffect` llamaba directamente a la función `cargarReservas` (que actualiza estado vía `setReservations`/`setError`), lo cual disparaba la regla de ESLint `react-hooks/set-state-in-effect` (riesgo de renders en cascada). Se corrigió moviendo la lógica async a una función autoejecutada (IIFE) dentro del propio `useEffect`, con una bandera local `ignorar` para no actualizar estado si el componente se desmonta antes de que la respuesta llegue. `cargarReservas` se conservó como función aparte, usada únicamente desde manejadores de evento (botón "Reintentar" en el estado de error, y tras `handleCancelar`), donde sí es válido llamarla directamente. Verificado por lectura directa del archivo y `npm run lint` sin errores.
- Toma `reservations[0]` como "mi reserva" — no contempla en la UI que el usuario pueda tener más de una reserva activa. Confirmado por el desarrollador (2026-09-10) que el backend sí permite varias reservas activas simultáneas por usuario; esto es una **limitación conocida de la interfaz actual**, no una regla de negocio ni un bug de backend (ver `INFORMATION_GAPS.md` GAP-10, resuelto, y `BUSINESS_RULES.md` BR-17).
- Acciones: `handleVerLugar` (consulta `GET /api/seats?date=` y abre un `Modal` con `SeatMap` en modo `"view"`), `handleEditar` (navega a `/reservar` pasando la reserva por `location.state`), `handleCancelar` (con `Popconfirm`, llama `DELETE /api/reservations/:id` y recarga), `handleApartarLugar` (navega a `/reservar` sin estado, para crear una nueva).
- Maneja estados de carga (`Skeleton`) y error (`Result status="error"` con botón de reintento).

### ReservarLugar.jsx ("Reservar lugar" / "Editar reserva")
- Propósito: seleccionar fecha y lugar disponible para crear una reserva nueva, o modificar una existente si llegó `location.state.reservaAEditar`.
- `DatePicker` con `disabledDate` que bloquea fechas pasadas.
- Al cambiar la fecha, vuelve a pedir `GET /api/seats?date=` y limpia el lugar seleccionado (excepto en la carga inicial, para conservar la preselección al editar — controlado con `useRef esPrimeraCarga`).
- Botón de confirmar deshabilitado hasta tener lugar y fecha seleccionados; texto cambia entre "Confirmar reserva" y "Guardar cambios" según el modo.
- Al confirmar, llama `createReservation` o `updateReservation` según corresponda, y navega de regreso a `/`.

## Componentes reutilizables

### SeatMap.jsx
- Recibe `seats`, `mode` (`"view"` | `"select"`), `selectedSeatId`, `onSelectSeat`.
- Renderiza una grilla 4 columnas (`gridTemplateColumns: repeat(4, 1fr)`), posicionando cada botón por `seat.row`/`seat.column`.
- Colorea cada celda según estado (disponible / ocupado / seleccionado) usando tokens de tema de Ant Design (`theme.useToken()`), nunca colores hardcodeados.
- Incluye subcomponente interno `Leyenda` para la leyenda de colores debajo del mapa.
- En modo `"select"`, solo los lugares con `status === 'disponible'` son clickeables.

## Hooks personalizados

- `useAuth()` (`src/features/auth/useAuth.js`): envuelve `useMsal()`; expone `usuarioActual` (primera cuenta de MSAL), `iniciarSesion` (`loginRedirect`), `cerrarSesion` (`logoutRedirect`).

## Providers / Context

- `MsalProvider` (de `@azure/msal-react`), inicializado en `main.jsx` con la instancia única `msalInstance`.
- `ConfigProvider` (de `antd`), en `main.jsx`, define el tema global (`borderRadius: 8`, `colorPrimary: '#2E7D32'` — verde).
- No se usa `React.Context` propio del proyecto, ni Redux, Zustand, ni React Query/TanStack Query.

## Layouts

- Un único layout definido inline en `App.jsx`: `Layout` de Ant Design con `Header` (logo/título + avatar con menú de usuario) y `Content` (donde se renderizan las rutas).

## Servicios consumidos (capa `src/api/`)

| Archivo | Función | Endpoint |
|---|---|---|
| `seats-api.js` | `getSeatsByDate(date)` | `GET /api/seats?date=` |
| `reservations-api.js` | `getMyReservations()` | `GET /api/reservations/me` |
| `reservations-api.js` | `createReservation({seatId, date})` | `POST /api/reservations` |
| `reservations-api.js` | `updateReservation(id, {seatId, date})` | `PUT /api/reservations/:id` |
| `reservations-api.js` | `deleteReservation(id)` | `DELETE /api/reservations/:id` |

Todas pasan por `httpClient.js` (instancia única de axios):
- Interceptor de request: obtiene el token silenciosamente (`acquireTokenSilent`) con el scope del API (`apiRequest`) y lo agrega como `Authorization: Bearer`.
- Interceptor de response: en éxito, retorna directamente `response.data.data` (desenvuelve el sobre `{success,data}`); en error 401/403 dispara `loginRedirect` de nuevo; en cualquier otro error, propaga un `Error` con el mensaje de `error.response.data.error.message` o un mensaje genérico de conexión.

## Manejo de estado

Estado local por componente vía `useState`/`useEffect`/`useRef` de React. No hay gestor de estado global propio del proyecto (no Redux, no Zustand, no Context API propio) más allá del contexto que provee `@azure/msal-react` para la sesión.

## Validaciones de UI

- `DatePicker` con `disabledDate` para impedir seleccionar fechas pasadas (`ReservarLugar.jsx`).
- Botón de confirmar deshabilitado si no hay lugar y fecha seleccionados.
- `Popconfirm` (diálogos de confirmación) antes de cancelar una reserva o de descartar una selección en curso.
- Alerta visual (`Alert type="warning"`) cuando todos los lugares de una fecha están ocupados.
- No hay validación de formularios con librerías dedicadas (ej. Formik, React Hook Form) — no se usan formularios tradicionales, solo selección visual (fecha + lugar).

## Archivos principales

- `src/main.jsx` — bootstrap: inicializa MSAL, monta `MsalProvider` + `ConfigProvider` + `App`.
- `src/App.jsx` — layout, rutas, guard de autenticación, menú de usuario.
- `src/pages/Inicio.jsx`, `src/pages/ReservarLugar.jsx` — pantallas principales.
- `src/components/SeatMap.jsx` — componente visual reutilizable.
- `src/features/auth/*` — integración con Azure AD/MSAL.
- `src/api/*` — capa de consumo HTTP.

## Flujo interno de renderizado (alto nivel)

`main.jsx` inicializa `msalInstance` → una vez resuelta la promesa, monta el árbol React (`MsalProvider > ConfigProvider > App`). `App.jsx` decide, según `AuthenticatedTemplate`/`UnauthenticatedTemplate`, si mostrar `PantallaLogin` o el `Layout` con `BrowserRouter` y las rutas `/` y `/reservar`.

## Variables de entorno del frontend (`VITE_*`)

Ver detalle completo en `DEPLOYMENT.md`. Resumen: `VITE_API_URL`, `VITE_AZURE_AD_CLIENT_ID`, `VITE_AZURE_AD_TENANT_ID`, `VITE_AZURE_AD_REDIRECT_URI`, `VITE_AZURE_AD_API_SCOPE`.

## Nota sobre archivo anómalo

Se había encontrado un archivo llamado `practicante-desarrollo` en la raíz de `reserva-lugares-oficina-front/`, **vacío** y **versionado en git** (`git ls-files` lo listaba). Coincidía exactamente con el nombre de una rama del repositorio (`practicante-desarrollo`). Era probable que se hubiera creado por error (ej. un comando de git mal ejecutado). **Resuelto (2026-09-10):** el archivo ya fue eliminado del working tree por el desarrollador (verificado por listado de directorio — ya no existe). Ver `RISKS.md` (R14, Mitigado) e `INFORMATION_GAPS.md` (GAP-14, Resuelto).

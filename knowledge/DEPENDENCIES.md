# Dependencias — Reserva de Lugares de Oficina

## Frontend (`reserva-lugares-oficina-front/package.json`)

| Dependencia | Propósito | Dónde se usa | Comentario técnico |
|---|---|---|---|
| `react` / `react-dom` ^19.2.8 (resuelto `19.3.0` tras `npm update` del 2026-09-10) | Framework de UI | Toda la app | Versión mayor reciente (React 19) |
| `vite` ^8.2.2 (resuelto `8.3.0` tras `npm update` del 2026-09-10) | Dev server / bundler | Todo el proyecto | — |
| `@vitejs/plugin-react` ^6.1.0 | Soporte JSX/Fast Refresh en Vite | `vite.config.js` | — |
| `antd` ^6.6.1 (resuelto `6.6.3` tras `npm update` del 2026-09-10) | Librería de componentes UI + theming | Todas las pantallas y componentes | Única librería de estilos permitida por el estándar interno; se usa vía tokens (`theme.useToken()`, `ConfigProvider`) |
| `react-router-dom` ^7.18.2 (resuelto `7.18.3` tras `npm update` del 2026-09-10) | Ruteo SPA | `App.jsx` | Rutas `/` y `/reservar` |
| `dayjs` ^1.11.23 | Manejo de fechas | `Inicio.jsx`, `ReservarLugar.jsx` | Formateo y comparación de fechas relativas |
| `axios` ^1.20.0 | Cliente HTTP | `src/api/httpClient.js` | Único punto de llamadas HTTP del frontend |
| `@azure/msal-browser` ^5.21.0 | Cliente base de MSAL | `msalInstance.js` | — |
| `@azure/msal-react` ^5.7.0 | Bindings de MSAL para React | `App.jsx`, `useAuth.js`, `main.jsx` | Provee `MsalProvider`, `useMsal`, `AuthenticatedTemplate` |

**Desarrollo:**

| Dependencia | Propósito |
|---|---|
| `eslint` ^10.9.0 (resuelto `10.10.0` tras `npm update` del 2026-09-10), `@eslint/js` ^10.0.1 | Linting base |
| `eslint-plugin-react-hooks` ^7.1.1 (sin cambio de versión) | Reglas de hooks de React — detectó R16 (`react-hooks/set-state-in-effect` en `Inicio.jsx`), ya corregido (ver `RISKS.md`) |
| `eslint-plugin-react-refresh` ^0.5.4 | Reglas de Fast Refresh |
| `globals` ^17.11.0 | Definición de globals para ESLint |
| `@types/react`, `@types/react-dom` | Tipos (aunque el proyecto no usa TypeScript en `.tsx`, son usados para autocompletado/IDE) |

## Backend (`reserva-lugares-oficina-api/package.json`)

| Dependencia | Propósito | Dónde se usa | Comentario técnico |
|---|---|---|---|
| `express` ^5.2.1 | Framework HTTP | `src/app.js`, `routes/*` | Versión mayor reciente (Express 5) |
| `cors` ^2.8.6 | Control de orígenes permitidos | `app.js` | Configurado con lista blanca vía env |
| `helmet` ^8.3.0 | Cabeceras HTTP de seguridad | `app.js` | Aplicado globalmente |
| `dotenv` ^17.4.2 | Carga de variables de entorno | `app.js` (primera línea) | — |
| `morgan` ^1.12.0 | Log de requests HTTP | `app.js` | Canalizado a `winston` |
| `winston` ^3.19.0 | Logging de aplicación/errores | `config/logger.js`, `errorHandler.js` | Con rotación diaria vía `winston-daily-rotate-file` (ver abajo) |
| `winston-daily-rotate-file` ^5.0.0 | Rotación diaria de archivos de log | `config/logger.js` | Agregado 2026-09-10 para cerrar riesgo R9 (`RISKS.md`); genera `logs/error-%DATE%.log` y `logs/combined-%DATE%.log` con `maxSize: '20m'` y `maxFiles: '14d'`, solo fuera de `NODE_ENV=development` |
| `express-rate-limit` ^8.7.0 | Límite de tasa de peticiones por IP | `app.js` (`apiLimiter`, montado en `/api` antes de `authMiddleware`) | Agregado 2026-09-10 para cerrar riesgo R8 (`RISKS.md`); 300 solicitudes / 15 min por IP |
| `express-validator` ^7.3.2 | Validación/sanitización de body | `reservationValidators.js` | Solo usado en `POST`/`PUT` de reservas |
| `jsonwebtoken` ^9.0.3 | Verificación de JWT | `authMiddleware.js` | Verifica firma RS256 |
| `jwks-rsa` ^4.1.0 | Obtención de claves públicas (JWKS) de Azure AD | `authMiddleware.js` | — |
| `mysql2` ^3.24.3 (resuelto `3.24.4` tras `npm update` del 2026-09-10) | Cliente MySQL (modo promesas) | `db/connection.js`, `services/*` | Pool de conexiones, `connectionLimit: 10` |

**Desarrollo:**

| Dependencia | Propósito |
|---|---|
| `nodemon` ^3.1.14 | Recarga automática en desarrollo (`npm run dev`) |

## Base de datos

No aplica gestor de dependencias de paquetes (MySQL no usa `package.json`); los "objetos" versionados son los scripts SQL en `reserva-lugares-oficina-db/scripts/`, numerados y con dependencias implícitas de orden de ejecución (ej. `fn_seat_is_available` debe existir antes que los SPs que la invocan).

## Infraestructura

No fue posible determinar esta información — no se encontró infraestructura como código (Terraform, ARM/Bicep, Pulumi) ni configuración de contenedores/orquestación en el repositorio.

## Pruebas

No fue posible determinar esta información — no se encontró ninguna dependencia de testing (`jest`, `vitest`, `mocha`, `supertest`, `@testing-library/*`, `cypress`, `playwright`) en ninguno de los dos `package.json`.

## Observación general sobre versiones

Varias dependencias están en versiones mayores muy recientes al momento del análisis (React 19, Vite 8, Express 5, Ant Design 6, ESLint 10, react-router-dom 7) — esto no es un problema en sí, pero implica menor tiempo de maduración/ecosistema de terceros compatible y conviene vigilar breaking changes al actualizar. No se evaluó aquí vulnerabilidades conocidas (CVEs) por versión, ya que no se ejecutó `npm audit` como parte de este análisis (ver `SECURITY.md`, gestión de vulnerabilidades).

**Actualización 2026-09-10:** el desarrollador corrió `npm outdated` y aplicó `npm update` en `reserva-lugares-oficina-front` y `reserva-lugares-oficina-api`, actualizando todo lo disponible **dentro de las mismas versiones mayores** ya en uso (sin saltar de mayor — eso sigue siendo una decisión de alcance aceptada, ver `RISKS.md` R11). Versiones resueltas confirmadas por lectura directa de `package.json`/`package-lock.json`:

| Paquete | Antes | Después (resuelto) |
|---|---|---|
| `react` / `react-dom` (front) | 19.2.x | `19.3.0` |
| `react-router-dom` (front) | 7.18.2 | `7.18.3` |
| `antd` (front) | 6.6.1 | `6.6.3` |
| `vite` (front) | 8.2.2 | `8.3.0` |
| `eslint` (front) | 10.9.0 | `10.10.0` |
| `mysql2` (api) | 3.24.3 | `3.24.4` |

El desarrollador confirmó que la API sigue respondiendo correctamente (`/health` → 200) y que el front compila (`npm run build` exitoso) después de la actualización. No se saltó ninguna dependencia de versión mayor (React sigue en 19, Express en 5, Vite en 8, Ant Design en 6, ESLint en 10, react-router-dom en 7); el riesgo de fondo de estar en mayores recientes se mantiene como aceptado (R11, Mitigado, no Resuelto al 100%).

Adicionalmente, al correr `npm run lint` en el front tras la actualización se encontró y corrigió un error real de `eslint-plugin-react-hooks` (regla `react-hooks/set-state-in-effect`) en `src/pages/Inicio.jsx`, preexistente y no relacionado con esta actualización de dependencias (`eslint-plugin-react-hooks` se quedó en `^7.1.1`). Ver `RISKS.md` (R16) y `FRONTEND.md`.

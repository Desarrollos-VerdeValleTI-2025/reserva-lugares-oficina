# Seguridad — Reserva de Lugares de Oficina

## Autenticación

**Mecanismo:** OAuth2/OIDC vía Microsoft Entra ID (Azure AD), usando MSAL en el frontend y verificación manual de JWT (RS256) en el backend con `jsonwebtoken` + `jwks-rsa`. *(Validado por código.)*

- Frontend: `PublicClientApplication` (singleton en `msalInstance.js`), flujo `loginRedirect`. Cache en `sessionStorage` (no `localStorage`) — alineado al estándar interno de Verde Valle.
- Backend: `authMiddleware.js` exige header `Authorization: Bearer <token>`; obtiene la clave pública de firma desde `https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys` (JWKS); valida:
  - **Audiencia (`aud`):** acepta el Client ID del API con o sin el prefijo `api://` (normaliza en código).
  - **Emisor (`iss`):** acepta tanto `https://login.microsoftonline.com/<tenant>/v2.0` como `https://sts.windows.net/<tenant>/`.
  - **Algoritmo:** `RS256` únicamente.
- El identificador de usuario (`req.user.email`) sale de `decoded.preferred_username || decoded.upn || decoded.unique_name || decoded.email` — nunca de un parámetro controlado por el cliente.
- Se aplica globalmente a todo `/api/*` (`app.use('/api', authMiddleware)`) y puntualmente a `/health/secure`. `/health` es el único endpoint público.

## Autorización

- No hay autorización granular por rol: cualquier token válido (de cualquier cuenta del tenant configurado) tiene acceso a **todas** las operaciones (`GET/POST/PUT/DELETE` de reservas). *(Validado por código — no hay verificación de claims de rol/grupo en `authMiddleware.js` ni en los controllers.)*
- La única "autorización a nivel de dato" es la comprobación de pertenencia: los stored procedures `web_up_update_reservation` y `web_de_cancel_reservation` verifican que `user_email` de la reserva coincida con el `user_email` recibido (que a su vez viene del token) antes de permitir editar/cancelar.

## Roles y permisos

No existe tabla de usuarios, roles ni permisos en la base de datos, ni claims de rol verificados en el backend. Todo usuario autenticado del tenant tiene el mismo nivel de acceso funcional.

**Estado (confirmado por el desarrollador, 2026-09-10 — N/A):** no es necesario especificar roles/permisos granulares por tratarse de una actividad de práctica. Es una decisión de alcance del proyecto, no un pendiente de negocio sin resolver. Ver `INFORMATION_GAPS.md` (GAP-09, N/A).

## JWT

- Emitidos por Azure AD (no un JWT propio del sistema). Verificados con `jsonwebtoken.verify` + clave pública dinámica (`jwks-rsa`), nunca con un secreto simétrico hardcodeado.
- No hay emisión de tokens propios por parte del backend (no hay endpoint de login local ni refresh token propio).

## OAuth2 / MSAL

Ver `INTEGRATIONS.md` para el detalle completo del flujo con los dos App Registrations (front SPA + API con scope `API.Access`).

## Sesiones

No hay sesiones de servidor (no `express-session`, no cookies de sesión). El "estado de sesión" vive enteramente en el cliente, gestionado por MSAL (`sessionStorage`) y renovado vía `acquireTokenSilent` en cada llamada HTTP (`httpClient.js`).

## API Keys

No encontrado. No hay mecanismo de API Key en ningún endpoint.

## Variables sensibles / manejo de secretos

| Variable | Dónde vive | Observación |
|---|---|---|
| `DB_PASSWORD` | `.env` / `.env.qas` del API (no versionados, correctamente en `.gitignore`) | Ver nota abajo: una versión anterior de esta contraseña quedó hardcodeada en un script SQL versionado en git; ya fue rotada por el equipo (GAP-04, resuelto). |
| `AZURE_AD_CLIENT_ID` / `AZURE_AD_TENANT_ID` | `.env` / `.env.qas` del API | No son secretos altamente sensibles por sí mismos (identificadores públicos de la app), pero deben mantenerse fuera de git — y así está configurado. |
| `VITE_AZURE_AD_CLIENT_ID` / `VITE_AZURE_AD_TENANT_ID` / `VITE_AZURE_AD_API_SCOPE` | `.env` / `.env.qas` del front | Igual que arriba; además, por ser una SPA, estos valores viajan al navegador de todas formas (no son secretos de servidor). |

**Manejo de `.gitignore`:** ambos proyectos (`front` y `api`) ignoran correctamente `.env`, `.env.qas` y `.env.prd`. Confirmado con `git ls-files`: ninguno de esos archivos está trackeado en el repositorio.

### Nota: contraseña de base de datos que quedó hardcodeada en script SQL versionado (resuelto)

El archivo **versionado en git** `reserva-lugares-oficina-db/scripts/01_create_database.sql` contiene (o contenía) una contraseña en texto plano:

```sql
CREATE USER IF NOT EXISTS 'app_reservas_api'@'localhost' IDENTIFIED BY 'Pr@cticanteDes04';
GRANT SELECT, INSERT, UPDATE, EXECUTE ON reservalugares.* TO 'app_reservas_api'@'localhost';
```

**Estado (confirmado por el desarrollador, 2026-09-10 — Resuelto):** la contraseña ya fue **rotada/cambiada** por el equipo, por lo que el valor anterior expuesto en el historial de git ya no es una credencial válida. Se conserva como recomendación general: **no volver a hardcodear secretos en scripts versionados en git**; si se necesita crear el usuario de aplicación como parte de un script de despliegue, preferir parametrizar la contraseña (variable de entorno o prompt en el momento de ejecución) en vez de dejarla en texto plano en el repositorio. Ver `RISKS.md` (R1) e `INFORMATION_GAPS.md` (GAP-04).

Sobre el permiso otorgado (`SELECT, INSERT, UPDATE, EXECUTE` en vez de solo `EXECUTE` vía rol): el desarrollador aclaró que fue **intencional**, para poder crear el usuario de aplicación dentro de la base de datos durante el despliegue; ya se ejecutó así en el entorno real. Ver detalle en `DATABASE.md` e `INFORMATION_GAPS.md` (GAP-05, resuelto).

## Cifrado

- **Datos en tránsito:** depende de que el despliegue real sirva la app y la API sobre HTTPS; en local todo corre sobre HTTP (`localhost`). El dominio de QAS (`practicadespliegue.verdevalle.com.mx`) sí usa `https://` en las URLs configuradas. No se encontró configuración de servidor (Nginx, certificados) en el repositorio para confirmar TLS en el propio despliegue del backend — ver `DEPLOYMENT.md`.
- **Datos en reposo:** no se encontró configuración de cifrado a nivel de base de datos (ej. TDE de MySQL) — no fue posible determinar esta información.
- **Certificados:** No encontrado en el repositorio.

## Cumplimiento normativo

**N/A (confirmado por el desarrollador, 2026-09-10).** No hay evidencia de LFPDPPP, ISO 27001, GDPR ni políticas internas de cumplimiento documentadas en el repositorio, y el desarrollador confirmó que no hay ningún marco de cumplimiento formal aplicable por el momento. Dado que el sistema maneja el correo corporativo del empleado como identificador (dato personal), esto queda registrado explícitamente como fuera de alcance para esta versión del proyecto, no como un hueco de información pendiente de investigar.

## Gestión de vulnerabilidades

**N/A (confirmado por el desarrollador, 2026-09-10).** No hay evidencia de SAST, DAST, Dependabot/Renovate, `npm audit` en pipeline, ni proceso formal de aplicación de parches de dependencias. El desarrollador confirmó que, por ser una actividad de capacitación, no se van a agregar herramientas de este tipo por ahora. Ver `INFORMATION_GAPS.md` (GAP-12, N/A).

## Otros hallazgos de seguridad relevantes

- `helmet()` aplicado globalmente en `app.js` — cabeceras HTTP de seguridad básicas presentes.
- `cors` con lista blanca explícita vía `ORIGENES_PERMITIDOS` (variable de entorno, separada por comas) — no se usa `origin: '*'`.
- Consultas parametrizadas (`pool.execute('CALL sp(?, ?)', [...])`) en todos los accesos a MySQL — sin concatenación de valores de usuario en SQL.
- **Resuelto (2026-09-10).** `express-rate-limit` ya está agregado a las dependencias (`^8.7.0`) y configurado en `app.js` como `apiLimiter` (`windowMs: 15 * 60 * 1000`, `max: 300` por IP), montado con `app.use('/api', apiLimiter)` antes de `app.use('/api', authMiddleware)`. Confirmado por lectura directa de `app.js` y `package.json`. Ver `INFORMATION_GAPS.md`/`RISKS.md` (R8, Mitigado).
- **Resuelto (2026-09-10).** `authMiddleware.js` ya **no** usa `console.log` de depuración sin condicionar. Se confirmó por lectura directa del archivo que el `console.log('DEBUG jwt.verify error ->', ...)` fue reemplazado por `logger.debug('JWT verification failed', { errorName: err.name, errorMessage: err.message })`, usando el logger `winston` ya existente en `src/config/logger.js` (mismo patrón que `errorHandler.js`). El nivel del logger es `'debug'` en desarrollo e `'info'` en calidad/producción, por lo que en QAS/Producción ese log ya no se emite. Ver `INFORMATION_GAPS.md` (GAP-11, Resuelto) y `RISKS.md` (R5, Mitigado).

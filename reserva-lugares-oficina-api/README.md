# reserva-lugares-oficina-api

API de reserva de lugares de oficina. Backend Node.js + Express, respaldado por una base de datos MySQL real (`reservalugares`, ver `reserva-lugares-oficina-db/`) — toda la lógica de negocio vive en stored procedures, el API solo los invoca. Protegido con autenticación real vía Azure AD (MSAL).

Proyecto simulado para capacitación, sin conexión con sistemas en producción.

## Requisitos

- Node.js LTS vigente
- MySQL 9.7 corriendo localmente, con la base de datos `reservalugares` ya creada (ver `reserva-lugares-oficina-db/scripts/`) y un usuario de aplicación acotado (`app_reservas_api`, solo con permiso `EXECUTE` sobre los stored procedures — nunca acceso directo a las tablas)

## Configuración

1. Copiar `.env.example` a `.env` y llenar los valores reales:
   - `DB_*` — conexión a tu MySQL local (host, puerto, usuario `app_reservas_api`, contraseña, `reservalugares` como base de datos).
   - `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` — del App Registration **del API** (no el del front; ver más abajo).
2. Instalar dependencias:
   ```
   npm install
   ```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor con recarga automática (nodemon) |
| `npm start` | Levanta el servidor en modo normal |

## Estructura

```
src/
├── config/       # Configuración: logger (winston), variables de entorno
├── db/           # Pool de conexión a MySQL (mysql2/promise)
├── middlewares/  # CORS, validación, auth (Azure AD), errores de negocio, manejo de errores
├── controllers/  # Lógica que maneja la solicitud HTTP (req, res)
├── routes/       # Definición de endpoints
├── services/     # Invocación de los stored procedures de la base de datos
└── app.js        # Inicializa servidor, middlewares y rutas
```

## Seguridad configurada

- `helmet` — cabeceras HTTP de seguridad, aplicado globalmente.
- `cors` — lista blanca de orígenes permitidos vía `ORIGENES_PERMITIDOS` (.env).
- `express-validator` — valida `seatId`/`date` en el body de `POST`/`PUT` de reservas.
- **Autenticación con Azure AD**: `authMiddleware` valida el JWT (firma, audiencia, emisor) en cada request a `/api/*` y a `/health/secure`. Sin token válido, responde `401` con el formato estándar. El `userEmail` de cada reserva se obtiene únicamente de `req.user.email` (del token) — nunca de query/body.
- Consultas parametrizadas (placeholders `?`) en cada llamada a la base de datos — nunca se concatenan valores del usuario en SQL.
- `morgan` + `winston` — log de requests y de errores de aplicación.
- Manejo de errores centralizado — nunca expone el stack trace al cliente. Los errores de negocio (`BusinessError`, generados por los `SIGNAL` de los stored procedures) sí muestran su mensaje real; cualquier otro error queda oculto detrás de un mensaje genérico.

## Formato estándar de respuesta

- Éxito: `{ success: true, data: {...} }`
- Error: `{ success: false, error: { code, message } }`

## Endpoints

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| GET | `/health` | No | Estado básico del servicio |
| GET | `/health/secure` | Sí | Estado básico + confirma el usuario autenticado |
| GET | `/api/seats?date=YYYY-MM-DD` | Sí | Grid de los 20 lugares con su estado para esa fecha |
| GET | `/api/reservations/me` | Sí | Reservas activas y futuras del usuario del token |
| POST | `/api/reservations` | Sí | Body `{ seatId, date }` — crea una reserva |
| PUT | `/api/reservations/:id` | Sí | Body `{ seatId, date }` — reprograma una reserva propia |
| DELETE | `/api/reservations/:id` | Sí | Cancela una reserva propia |

## Configurar Azure AD (App Registration) en local

El backend valida tokens emitidos para su **propio** App Registration (distinto al del front) — el front pide un token con el scope `api://<client-id-del-api>/API.Access`, y este servidor valida que la audiencia (`aud`) del token sea ese mismo Client ID.

Ver la guía completa paso a paso (creación de ambos App Registrations, scope, permisos) en el [README del front](../reserva-lugares-oficina-front/README.md#configurar-azure-ad-app-registration-en-local). Aquí solo necesitas:

```env
AZURE_AD_TENANT_ID=<tenant-id>
AZURE_AD_CLIENT_ID=api://<client-id-del-API>   # el del App Registration del API, no el del front
```

**Importante sobre el formato**: para un scope de "Expose an API", el `aud` (audiencia) del token de acceso viene con el **App ID URI completo** (`api://<client-id>`), no el GUID solo — a diferencia de un ID token normal. El middleware (`authMiddleware.js`) ya acepta ambas formas por robustez (con o sin el prefijo `api://`), y también ambos formatos de emisor (`v2.0` o `sts.windows.net`, según cómo esté configurado el "Accepted token version" del App Registration) — pero pon el valor con el prefijo en tu `.env` para que coincida exactamente con lo que emite Azure.

### Probar el API protegido con Postman (antes de integrar el front)

1. En Postman, pestaña **Authorization** → tipo **OAuth 2.0** → **Get New Access Token**.
2. Configura la URL de autorización/token de tu tenant (`https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize` y `.../token`), Grant Type **Authorization Code (With PKCE)**, el Client ID del **front**, y como scope `api://<client-id-del-api>/API.Access`.
3. Al pedir el token, Postman abre tu navegador para el login real de Microsoft. **Necesitas que la Redirect URI de Postman (`https://oauth.pstmn.io/v1/callback`) esté agregada como Redirect URI tipo SPA en el App Registration del front** — si no, da `AADSTS50011: redirect_uri_mismatch`.
4. Si Postman te muestra tanto un **Access Token** como un **ID Token**, usa el **Access Token** — el ID Token trae como audiencia el Client ID del front (nunca el del API) y el middleware lo va a rechazar con "Token inválido o expirado", aunque el login haya sido exitoso.
5. Con el Access Token correcto, prueba `GET /api/seats?date=2026-09-01` con el header `Authorization: Bearer <token>` — debe responder `200`.
6. Sin el header (o con un token inválido), la misma ruta debe responder `401` con el formato estándar de error.

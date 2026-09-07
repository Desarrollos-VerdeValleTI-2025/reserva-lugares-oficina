# Reserva de Lugares de Oficina

Aplicación web para reservar lugares de trabajo en la oficina. Requiere iniciar sesión con una cuenta de Verde Valle (Azure AD). Una vez dentro, permite ver si ya tienes un lugar apartado, consultarlo en un mapa de solo lectura, editarlo (cambiar lugar/fecha), cancelarlo, o elegir fecha y lugar disponible para hacer una nueva reserva.

Proyecto simulado para capacitación, sin conexión con sistemas en producción.

## Tecnologías

- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [Ant Design](https://ant.design/) (UI + tokens de tema)
- [react-router-dom](https://reactrouter.com/) (ruteo)
- [dayjs](https://day.js.org/) (manejo de fechas)
- [axios](https://axios-http.com/) (consumo del API real)
- [@azure/msal-react](https://github.com/AzureAD/microsoft-authentication-library-for-js) + [@azure/msal-browser](https://github.com/AzureAD/microsoft-authentication-library-for-js) (login con Azure AD)

## Estructura del proyecto

```
src/
├── api/                       # Consumo del API real (Actividad 4)
│   ├── httpClient.js          # Instancia de axios: adjunta el token, centraliza errores, maneja 401/403
│   ├── seats-api.js
│   └── reservations-api.js
├── features/
│   └── auth/
│       ├── msalConfig.js      # Configuración de MSAL (client id, tenant, scopes)
│       ├── msalInstance.js    # Instancia única de MSAL, compartida por toda la app
│       └── useAuth.js         # Hook con el usuario actual, login y logout
├── components/
│   └── SeatMap.jsx            # Mapa de lugares reutilizable (modo lectura y modo selección)
├── pages/
│   ├── Inicio.jsx             # Resumen de la reserva activa (ver, editar, cancelar)
│   └── ReservarLugar.jsx      # Selección de fecha y lugar (crear o editar una reserva)
├── App.jsx                    # Layout, rutas, y el guard de autenticación (AuthenticatedTemplate)
└── main.jsx                   # Punto de entrada + MsalProvider + ConfigProvider (tema)
```

## Cómo correr el proyecto en local

Requisitos: [Node.js](https://nodejs.org/) 18 o superior, y el backend (`reserva-lugares-oficina-api`) corriendo en paralelo.

```bash
# 1. Clonar el repositorio
git clone https://github.com/PracticanteDesarrolloVV/reserva-lugares-oficina.git
cd reserva-lugares-oficina/reserva-lugares-oficina-front

# 2. Instalar dependencias
npm install

# 3. Copiar .env.example a .env y llenar los valores (ver sección de Azure AD abajo)
cp .env.example .env

# 4. Levantar el servidor de desarrollo
npm run dev
```

Luego abre `http://localhost:5173` en el navegador. Asegúrate de que el backend esté corriendo (`npm run dev` en `reserva-lugares-oficina-api`) antes de iniciar sesión, o las llamadas al API van a fallar.

### Otros scripts disponibles

- `npm run build` — genera la versión de producción.
- `npm run preview` — sirve localmente el build de producción.
- `npm run lint` — corre ESLint sobre el proyecto.

## Configurar Azure AD (App Registration) en local

Esta app usa **dos** App Registrations distintos en el mismo tenant de Azure AD:

1. **App Registration del front** (SPA) — con el que el usuario inicia sesión.
2. **App Registration del API** — expone un scope que el front pide para poder llamar al backend. El backend valida que el token traiga ese scope/audiencia.

Si ya tienes ambos creados (por ejemplo, los que te compartió tu tutor para este ejercicio), solo necesitas llenar el `.env` — puedes saltarte al paso 5.

### 1. Crear el App Registration del front (si no existe)

1. Entra al [portal de Azure](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**.
2. Nombre: algo descriptivo, ej. `reserva-lugares-oficina-front`.
3. Tipo de cuenta: según lo que indique tu organización (normalmente "Accounts in this organizational directory only").
4. Plataforma: **Single-page application (SPA)**, con Redirect URI `http://localhost:5173`.
5. Guarda el **Application (client) ID** y el **Directory (tenant) ID** que aparecen en la pantalla de Overview — son los que van en `VITE_AZURE_AD_CLIENT_ID` y `VITE_AZURE_AD_TENANT_ID`.

### 2. Crear el App Registration del API (si no existe)

1. Otro **New registration**, ej. `reserva-lugares-oficina-api`. No necesita Redirect URI (no es una app que hace login).
2. Ve a **Expose an API** → **Add a scope**. Azure te va a pedir configurar primero el "Application ID URI" (déjalo con el valor por defecto, `api://<client-id>`).
3. Crea el scope, ej. `API.Access`, con estado "Enabled". El scope completo queda como `api://<client-id-del-api>/API.Access`.
4. Anota el **Application (client) ID** de este registro — es distinto al del front, y es el que usa el **backend** (`AZURE_AD_CLIENT_ID` en el `.env` del API).

### 3. Dar permiso al front para pedir el scope del API

1. En el App Registration del **front** → **API permissions** → **Add a permission** → **My APIs** → selecciona el registro del API → marca el scope `API.Access`.
2. Si tu organización lo requiere, un administrador debe darle "Admin consent".

### 4. Confirmar el flujo de autenticación

El front usa **login redirect**: al hacer login, MSAL redirige a la página de Microsoft, y al volver, `useAuth().usuarioActual` queda disponible. Para llamar al backend, `httpClient.js` pide (en silencio, sin que el usuario lo note) un token con el scope del API — nunca el mismo token con el que inició sesión.

### 5. Llenar el `.env`

```env
VITE_AZURE_AD_CLIENT_ID=<client-id-del-front>
VITE_AZURE_AD_TENANT_ID=<tenant-id>
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173
VITE_AZURE_AD_API_SCOPE=api://<client-id-del-api>/API.Access
```

El backend necesita, en su propio `.env` (ver README de `reserva-lugares-oficina-api`):

```env
AZURE_AD_TENANT_ID=<mismo-tenant-id>
AZURE_AD_CLIENT_ID=api://<client-id-del-API>   # OJO: el del API (con el prefijo api://), no el del front
```

### Problemas comunes al configurar esto

- **`AADSTS50011: redirect_uri_mismatch`** al probar con Postman → falta agregar `https://oauth.pstmn.io/v1/callback` como Redirect URI (tipo SPA) en el App Registration del front.
- **"Token inválido o expirado" aunque el login sí funcionó** → revisa que estés usando el **Access Token**, no el **ID Token** (Postman a veces da los dos); y que `AZURE_AD_CLIENT_ID` en el `.env` del backend lleve el prefijo `api://`.
- **Nunca sale la pantalla de login, o el navegador se queda en blanco** → confirma que estás abriendo el front en un navegador de verdad (Chrome/Edge/Firefox), no en un navegador embebido como el "Simple Browser" de VS Code — este último no soporta bien el flujo de redirect de MSAL.

## Contrato de datos

Los endpoints en `src/api/` respetan el siguiente contrato (fijo desde la Actividad 1, no se modifica):

- `GET /api/seats?date=YYYY-MM-DD` — grid completo de lugares con su estado para esa fecha.
- `GET /api/reservations/me` — reservas activas del usuario autenticado (identificado por el token, no por parámetro).
- `POST /api/reservations` — body `{ seatId, date }`, crea una reserva.
- `PUT /api/reservations/:id` — body `{ seatId, date }`, reprograma una reserva existente.
- `DELETE /api/reservations/:id` — cancela una reserva.

**Forma de un lugar:**
```json
{ "id": 2, "code": "A2", "row": 1, "column": 2, "status": "disponible" }
```

**Forma de una reserva:**
```json
{ "id": 10, "seatId": 2, "seatCode": "A2", "date": "2026-09-01", "userEmail": "..." }
```

## Responsable

PracticanteDesarrolloVV (practicantedes@verdevalle.com)

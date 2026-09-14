# Integraciones — Reserva de Lugares de Oficina

## Resumen

Se encontró **una sola integración externa real**: Microsoft Entra ID / Azure AD, vía MSAL (frontend) y `jsonwebtoken` + `jwks-rsa` (backend). No se encontró evidencia de SAP, Oracle, SMTP, storage externo (Blob/S3), webhooks, colas/brokers (RabbitMQ, Kafka, Service Bus), ni servicios REST/SOAP de terceros adicionales.

## Microsoft Entra ID (Azure AD) — Autenticación / Identidad

| Aspecto | Detalle |
|---|---|
| **Propósito** | Login corporativo (SSO) del frontend y emisión/validación de tokens de acceso para autorizar llamadas al backend. |
| **Protocolo** | OAuth 2.0 / OpenID Connect. Flujo: Authorization Code con redirect (`loginRedirect` de MSAL) desde el navegador. |
| **SDK / librerías** | Frontend: `@azure/msal-browser` + `@azure/msal-react`. Backend: `jsonwebtoken` (verificación de firma/claims) + `jwks-rsa` (obtención de claves públicas del tenant). |
| **Autenticación** | Dos **App Registrations** distintos en el mismo tenant: (1) App del **front** (tipo SPA, con Redirect URI), usado para el login del usuario; (2) App del **API**, que expone el scope `API.Access` (`api://<client-id-api>/API.Access`). El front pide un token con ese scope específicamente para llamar al backend — nunca usa el mismo token del login. |
| **Archivos relacionados** | `reserva-lugares-oficina-front/src/features/auth/msalConfig.js`, `msalInstance.js`, `useAuth.js`, `src/api/httpClient.js`; `reserva-lugares-oficina-api/src/middlewares/authMiddleware.js`. |
| **Configuración (env)** | Front: `VITE_AZURE_AD_CLIENT_ID`, `VITE_AZURE_AD_TENANT_ID`, `VITE_AZURE_AD_REDIRECT_URI`, `VITE_AZURE_AD_API_SCOPE`. Backend: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID` (con prefijo `api://`). |
| **Riesgos** | (1) Dependencia total de la disponibilidad de Azure AD: si el servicio de Microsoft tiene una interrupción, nadie puede iniciar sesión ni renovar tokens. (2) El middleware backend acepta el emisor tanto en formato v2.0 como v1.0 (`sts.windows.net`) "por robustez" — mayor superficie de validación a mantener. (3) Un `console.log` de depuración en `authMiddleware.js` imprime `err.name`/`err.message` de cualquier fallo de verificación de JWT, sin condicionar por ambiente — ver `SECURITY.md`/`RISKS.md`. (4) Cache de MSAL en `sessionStorage` (correcto según el estándar interno), pero el logout es por `logoutRedirect` completo, sin manejo explícito de expiración de sesión visible en la UI. |
| **Información faltante** | No se encontró documentación de qué tenant/organización de Azure AD real se usa en producción (solo hay un `tenant_id` de ejemplo/QAS: `cc5673b7-0b91-4188-bf30-f0e9c2ed456d`, en `.env.qas`, archivo no versionado). No se encontró evidencia de "Admin consent" ya otorgado o pendiente. No se encontró configuración de MFA/Conditional Access (queda fuera del alcance del código del proyecto, del lado de Azure AD). |

## Otras integraciones evaluadas explícitamente (sin evidencia encontrada)

| Integración | Resultado |
|---|---|
| SAP | No encontrado |
| Oracle | No encontrado |
| SMTP / envío de correo | No encontrado |
| Storage externo (Blob, S3, etc.) | No encontrado |
| Webhooks (entrantes o salientes) | No encontrado |
| Servicios REST/SOAP de terceros | No encontrado |
| Colas / Brokers (RabbitMQ, Kafka, Azure Service Bus, etc.) | No encontrado |
| Microsoft Graph API | No encontrado (el proyecto usa Azure AD solo para autenticación, no para leer datos de Graph) |

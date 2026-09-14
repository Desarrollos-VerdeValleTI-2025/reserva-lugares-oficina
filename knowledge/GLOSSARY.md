# Glosario — Reserva de Lugares de Oficina

| Término | Definición | Módulo relacionado |
|---|---|---|
| **App Registration** | Registro de una aplicación en Microsoft Entra ID (Azure AD) que le permite autenticar usuarios y/o exponer una API. Este proyecto usa dos: uno para el front (SPA) y otro para el API. | Autenticación / Integraciones |
| **Audiencia (`aud`)** | Claim del JWT que indica para quién fue emitido el token (en este caso, el Client ID del App Registration del API). El backend valida que coincida antes de aceptar el token. | Seguridad |
| **BusinessError** | Clase de error propia del backend (`middlewares/businessError.js`) usada para errores de negocio "seguros" de mostrar al cliente (a diferencia de errores internos, que muestran un mensaje genérico). | Backend |
| **Cancelación lógica (soft delete)** | Marcar una reserva como cancelada (`is_active=false`, `is_deleted=true`, `deleted_at=NOW()`) sin borrar el registro de la base de datos. | Base de datos / Reglas de negocio |
| **dbo_reservations** | Tabla de MySQL que almacena las reservas hechas por los usuarios. | Base de datos |
| **dbo_seats** | Tabla de MySQL con los 20 lugares físicos fijos de la oficina. | Base de datos |
| **Emisor (`iss`)** | Claim del JWT que identifica quién emitió el token (Azure AD del tenant configurado). El backend acepta el formato v1.0 y v2.0. | Seguridad |
| **fn_seat_is_available** | Función de MySQL que determina si un lugar está disponible en una fecha dada. | Base de datos |
| **Grid de disponibilidad** | Vista de los 20 lugares con su estado (disponible/ocupado) para una fecha específica, devuelta por `GET /api/seats`. | Negocio / API |
| **httpClient** | Instancia única de Axios (`src/api/httpClient.js`) que centraliza la inyección del token de autenticación y el manejo de errores HTTP en el frontend. | Frontend |
| **JWKS (JSON Web Key Set)** | Conjunto de claves públicas publicado por Azure AD, usado por el backend (`jwks-rsa`) para verificar la firma de los JWT recibidos. | Seguridad |
| **JWT (JSON Web Token)** | Token firmado que representa la identidad de un usuario autenticado; en este proyecto es emitido por Azure AD, nunca por el propio backend. | Seguridad |
| **MSAL (Microsoft Authentication Library)** | Librería oficial de Microsoft para integrar login con Azure AD; usada en el frontend vía `@azure/msal-browser` y `@azure/msal-react`. | Frontend / Seguridad |
| **reserva activa** | Registro de `dbo_reservations` con `is_active=TRUE` e `is_deleted=FALSE`. | Reglas de negocio |
| **scope `API.Access`** | Permiso expuesto por el App Registration del API ("Expose an API"), que el front solicita para poder llamar al backend con un token distinto al del login. | Integraciones / Seguridad |
| **SeatMap** | Componente reutilizable del frontend que dibuja la grilla de 20 lugares, en modo lectura o modo selección. | Frontend |
| **SIGNAL / RESIGNAL** | Instrucciones de MySQL usadas en los stored procedures para lanzar errores de negocio controlados (ej. "El lugar no está disponible"), que el backend traduce a `BusinessError`. | Base de datos / Backend |
| **Stored Procedure (SP)** | Rutina almacenada en MySQL que encapsula lógica de negocio (validaciones, transacciones). Todo el acceso a datos desde el backend se hace exclusivamente a través de SPs. | Base de datos |
| **user_email** | Identificador del usuario dentro del sistema; siempre proviene del claim del token de Azure AD, nunca de un parámetro enviado por el cliente. No existe una tabla de usuarios propia. | Reglas de negocio / Seguridad |

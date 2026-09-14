# Decisiones Arquitectónicas / Técnicas — Reserva de Lugares de Oficina

## D1. Autenticación delegada 100% a Azure AD/MSAL con dos App Registrations separados

- **Decisión:** el sistema no implementa un login propio ni JWT propio; toda la identidad se delega a Microsoft Entra ID, usando un App Registration para el front (SPA) y otro distinto para el API (que expone el scope `API.Access`).
- **Evidencia:** `msalConfig.js`, `authMiddleware.js`, README de front y de API (sección "Configurar Azure AD").
- **Motivo probable:** SSO corporativo de Verde Valle — el estándar interno de la empresa (`verdevalle-js-standard`) indica MSAL para apps internas con SSO Azure AD.
- **Beneficio:** no se gestionan contraseñas propias ni tabla de usuarios; se aprovecha la identidad corporativa ya existente; separación clara entre "quién soy" (login del front) y "qué puedo llamar" (scope del API).
- **Riesgo / desventaja:** dependencia total de la disponibilidad de Azure AD; mayor complejidad de configuración inicial (dos App Registrations, consentimiento de permisos); el middleware acepta múltiples formatos de audiencia/emisor "por robustez", lo que amplía la superficie de validación a mantener.
- **Alternativas posibles:** JWT propio con tabla de usuarios y contraseñas — descartado según el estándar interno, que reserva esa opción para APIs consumidas por clientes externos, no para apps internas.

## D2. Toda la lógica de negocio de reservas vive en stored procedures MySQL

- **Decisión:** el backend nunca ejecuta `SELECT`/`INSERT`/`UPDATE` directo sobre `dbo_seats`/`dbo_reservations`; solo invoca funciones y stored procedures (`CALL sp(...)`).
- **Evidencia:** `seatsService.js`, `reservationsService.js` (únicamente `pool.execute('CALL ...')`), README de `reserva-lugares-oficina-db`.
- **Motivo probable:** estándar de bases de datos de Verde Valle — separación de responsabilidades entre capa de aplicación y capa de datos, y principio de mínimo privilegio (el usuario de aplicación debería solo poder ejecutar, no manipular tablas directamente).
- **Beneficio:** lógica de validación centralizada y reutilizable (ej. `fn_seat_is_available` la usan tanto `create` como `update`); menor superficie de inyección SQL al no construir queries dinámicas desde Node.
- **Riesgo / desventaja:** la lógica de negocio queda dividida entre dos lenguajes (JavaScript y SQL procedural), lo que dificulta escribir pruebas unitarias del backend sin una base de datos real; requiere que cualquier desarrollador que mantenga el backend también entienda SQL procedural de MySQL.

## D3. Cancelación lógica (soft delete) de reservas, nunca `DELETE` físico

- **Decisión:** cancelar una reserva ejecuta un `UPDATE` que marca `is_active=false, is_deleted=true, deleted_at=NOW()`, en vez de eliminar el registro.
- **Evidencia:** `web_de_cancel_reservation.sql`; comentario explícito en `04_create_dbo_reservations.sql`; confirmado por el usuario en el contexto funcional.
- **Motivo:** conservar histórico/trazabilidad de reservas y permitir volver a reservar el mismo lugar/fecha después de cancelar (por eso no existe `UNIQUE(id_seat, reservation_date)`).
- **Beneficio:** auditoría e histórico conservados; evita bloqueos de unicidad al re-reservar.
- **Riesgo / desventaja:** la tabla `dbo_reservations` crecerá indefinidamente sin una política de purga o archivado — no se encontró evidencia de que exista tal política. Ver `RISKS.md`.

## D4. Formato de respuesta uniforme `{success,data}` / `{success,error}` fijo desde el inicio

- **Decisión:** todos los endpoints del backend responden con el mismo sobre (`envelope`), y el frontend tiene un único punto (`httpClient.js`) que lo desenvuelve.
- **Evidencia:** todos los controllers y middlewares de error del backend; interceptor de respuesta en `httpClient.js`; los tres README del repositorio lo documentan igual.
- **Motivo:** contrato estable declarado explícitamente por el usuario como invariante del proyecto desde la primera iteración.
- **Beneficio:** consumo predecible en el frontend; manejo de errores centralizado en un solo interceptor.
- **Riesgo / desventaja:** no se detectó ninguno relevante.

## D5. Caché de MSAL en `sessionStorage`, no en `localStorage`

- **Decisión:** `msalConfig.js` configura `cache.cacheLocation: 'sessionStorage'`.
- **Evidencia:** `reserva-lugares-oficina-front/src/features/auth/msalConfig.js`.
- **Motivo probable:** alineación al estándar interno de Verde Valle, que prohíbe JWT en `localStorage`.
- **Beneficio:** menor superficie de robo de token persistente vía XSS entre reinicios del navegador.
- **Riesgo / desventaja:** la sesión se pierde al cerrar la pestaña/navegador (fricción de UX menor), considerado aceptable dado el objetivo de seguridad.

## D6. Grid de asientos fijo (20 lugares) modelado como catálogo, no como recurso dinámico

- **Decisión:** los 20 lugares (`dbo_seats`) se insertan una sola vez como datos semilla y se marcan como "nunca cambian" (según comentario del README de la BD); no hay endpoint para crear/editar/eliminar lugares.
- **Evidencia:** `03_insert_dbo_seats.sql`, ausencia de rutas `POST/PUT/DELETE /api/seats`.
- **Motivo probable:** el alcance del proyecto (capacitación) fija una oficina con una distribución física conocida y estática.
- **Beneficio:** simplicidad — no se requiere un módulo de administración de espacios.
- **Riesgo / desventaja:** si en el futuro el número/distribución real de lugares cambia, requiere una migración manual de datos; no hay proceso de administración de catálogo.

## D7. Creación del usuario de aplicación de MySQL con permisos directos (`SELECT, INSERT, UPDATE, EXECUTE`) en el script de despliegue, en vez de únicamente `EXECUTE` vía rol

- **Decisión:** `01_create_database.sql` crea al usuario `app_reservas_api` y le otorga `SELECT, INSERT, UPDATE, EXECUTE` directo sobre `reservalugares.*`, en vez de asignarle únicamente el rol `rol_reservas_api` (solo `EXECUTE`) que documenta el README de la base de datos.
- **Evidencia:** `reserva-lugares-oficina-db/scripts/01_create_database.sql`; confirmación explícita del desarrollador (2026-09-10).
- **Motivo (confirmado por el desarrollador, no inferido):** los permisos amplios se usaron para poder crear el usuario de aplicación dentro de la base de datos durante el despliegue; ya se ejecutó así en el entorno real.
- **Beneficio:** simplifica el script de aprovisionamiento inicial del usuario de aplicación en un solo paso.
- **Riesgo / desventaja:** el usuario de aplicación queda con más privilegios de los estrictamente necesarios si toda la lógica de acceso a datos pasa por stored procedures (principio de mínimo privilegio no aplicado al 100%); el README de la base de datos documenta un enfoque distinto (solo `EXECUTE` vía rol), lo que podría confundir a un desarrollador nuevo que solo lea el README.
- **Alternativas posibles:** mantener el enfoque de rol con solo `EXECUTE` documentado en el README, y crear el usuario/asignar el rol en un paso de aprovisionamiento separado, no en el mismo script que crea el esquema.

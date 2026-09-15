# Configuración y Despliegue — Reserva de Lugares de Oficina

## Ambientes

Se identifican, por convención de nombres de archivo, dos ambientes reales: desarrollo (`.env`) y calidad/QAS (`.env.qas`). El `.gitignore` de ambos proyectos contempla `.env.prd`, pero **no existe el archivo** en el repositorio.

**Producción — N/A confirmado (2026-09-10).** El desarrollador confirmó explícitamente que, por ahora, el proyecto es únicamente una actividad de capacitación/QAS: **no existe ni está planeado** un ambiente de Producción real por el momento. Esto ya no es un hueco de información pendiente de investigar (ver `INFORMATION_GAPS.md`, GAP-13, N/A confirmado) — es una confirmación de alcance del proyecto.

| Entorno | URL / Host | Variables relevantes | Fuente |
|---|---|---|---|
| Desarrollo | Front: `http://localhost:5173` · API: `http://localhost:4000` | `.env` en cada proyecto (no versionado) | `.env.example` (front y api) |
| Pruebas / QAS | Front y API: `https://practicadespliegue.verdevalle.com.mx` (front) / `https://practicadespliegue.verdevalle.com.mx/api` (API), servidos a través de **Nginx** (confirmado por el desarrollador) | `.env.qas` en cada proyecto (no versionado, presente localmente) | `reserva-lugares-oficina-front/.env.qas`, `reserva-lugares-oficina-api/.env.qas`; Nginx confirmado por el desarrollador (2026-09-10), no hay `nginx.conf` versionado en el repositorio |
| Producción | N/A — no existe ni está planeado por el momento | N/A (no existe `.env.prd`) | Contexto usuario (confirmado 2026-09-10: alcance actual es solo capacitación/QAS) |

## Variables de entorno

**Backend (`reserva-lugares-oficina-api`):**

| Variable | Propósito |
|---|---|
| `PORT` | Puerto del servidor (default 4000) |
| `NODE_ENV` | `development` \| `qas` \| `production` — controla nivel de log y si Winston escribe a archivo |
| `ORIGENES_PERMITIDOS` | Lista blanca de orígenes CORS, separados por coma |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL |
| `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID` | Validación de JWT (tenant y audiencia del App Registration del API) |

**Frontend (`reserva-lugares-oficina-front`, prefijo `VITE_` obligatorio):**

| Variable | Propósito |
|---|---|
| `VITE_API_URL` | URL base del backend, incluyendo `/api` |
| `VITE_AZURE_AD_CLIENT_ID`, `VITE_AZURE_AD_TENANT_ID`, `VITE_AZURE_AD_REDIRECT_URI` | Configuración de MSAL para el login (App Registration del front) |
| `VITE_AZURE_AD_API_SCOPE` | Scope del API que el front solicita (`api://<client-id-api>/API.Access`) |

Ambos proyectos siguen la convención `.env` (local) / `.env.example` (plantilla versionada) / `.env.qas` / `.env.prd`, y usan `process.env.NODE_ENV` / `import.meta.env` respectivamente — sin banderas manuales para simular ambiente, conforme al estándar interno.

## Archivos de configuración

- `reserva-lugares-oficina-front/vite.config.js` — configuración mínima (`@vitejs/plugin-react`).
- `reserva-lugares-oficina-front/eslint.config.js` — reglas de lint (flat config), incluye `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`.
- No se encontró `nginx.conf`, `Dockerfile`, `docker-compose.yml`, ni ningún archivo de configuración de servidor web/reverse proxy en el repositorio.

## Scripts disponibles

**Backend:**
| Script | Comando | Uso |
|---|---|---|
| `npm run dev` | `nodemon src/app.js` | Desarrollo con recarga automática |
| `npm start` | `node src/app.js` | Modo normal |

**Frontend:**
| Script | Comando | Uso |
|---|---|---|
| `npm run dev` | `vite` | Servidor de desarrollo |
| `npm run build` | `vite build` | Build de producción |
| `npm run build:qas` | `vite build --mode qas` | Build apuntando al modo `qas` (carga `.env.qas`) |
| `npm run lint` | `eslint .` | Linting |
| `npm run preview` | `vite preview` | Sirve localmente el build de producción |

## Procedimiento de build

- Frontend: `vite build` (o `vite build --mode qas`) genera artefactos estáticos. No se encontró documentación de dónde se publican esos artefactos (qué servidor web los sirve).
- Backend: no requiere build (Node ejecuta `src/app.js` directamente); no hay transpilación ni bundling documentado para el backend.

## Procedimiento de despliegue

**Confirmado por el desarrollador (2026-09-10):** el despliegue a QAS se realiza por medio de **Nginx**, que sirve el build estático del frontend y proxya las peticiones `/api` hacia el backend Node/Express. El repositorio no versiona el archivo de configuración de Nginx (`nginx.conf`) ni un script de despliegue automatizado; el proceso es **manual**: se construye el build del frontend (`npm run build:qas`), se publica en el servidor donde corre Nginx, y el backend se ejecuta directamente con Node (`npm start`) detrás del proxy. No está planeado automatizar este proceso por ahora (ver CI/CD abajo).

## CI/CD

**Confirmado por el desarrollador (2026-09-10): despliegue manual, sin CI/CD.** No existe carpeta `.github/workflows/`, ni archivos de Azure DevOps (`azure-pipelines.yml`), GitLab CI (`.gitlab-ci.yml`) ni Jenkinsfile en ningún nivel del repositorio. El desarrollador confirmó que el despliegue es manual y que **no hay CI/CD planeado por ahora** — esto es una decisión de alcance del proyecto (capacitación), no un hueco de documentación pendiente. Ver `INFORMATION_GAPS.md` (GAP-01, resuelto).

## Docker

**Confirmado por el desarrollador (2026-09-10): no se usa Docker, no está planeado.** No hay `Dockerfile` ni `docker-compose.yml` en el repositorio. El README raíz solo describe ejecución nativa con `npm run dev` para cada componente y MySQL corriendo localmente (Workbench / cliente `mysql`); en QAS, el backend corre igual de forma nativa detrás de Nginx. El desarrollador confirmó que no se planea contenerizar el proyecto por ahora. Ver `INFORMATION_GAPS.md` (GAP-06, resuelto).

## Monitoreo y observabilidad

**N/A para esta etapa del proyecto (confirmado por el desarrollador, 2026-09-10).** El proyecto no avanza por ahora más allá de una actividad de capacitación, por lo que métricas, alertas y gestión de incidencias formales no aplican en esta etapa. Esto ya no es un hueco de información pendiente de investigar (ver `INFORMATION_GAPS.md`, GAP-08, N/A).

Como referencia técnica (no como "monitoreo" formal), el backend sí cuenta con logging básico de aplicación:

| Aspecto | Herramienta / Estrategia | Fuente |
|---|---|---|
| Logs (backend) | `morgan` (requests HTTP) canalizado a `winston`; `winston` también captura errores de aplicación. En `development` solo consola; fuera de `development`, además escribe con rotación diaria vía `winston-daily-rotate-file` (`logs/error-%DATE%.log`, `logs/combined-%DATE%.log`). | `src/config/logger.js`, `src/app.js` |

**Resuelto (2026-09-10).** Los logs de `winston` a archivo ya tienen rotación configurada: `reserva-lugares-oficina-api/src/config/logger.js` usa `winston-daily-rotate-file` (`^5.0.0` en `package.json`) mediante `DailyRotateFile`, con `datePattern: 'YYYY-MM-DD'`, `maxSize: '20m'` y `maxFiles: '14d'` para ambos archivos de log. Confirmado por lectura directa de `logger.js` y `package.json`. Ver `RISKS.md` (R9, Mitigado).

## Gestión de versiones

- **Control de versiones:** Git, repositorio único en GitHub (`https://github.com/PracticanteDesarrolloVV/reserva-lugares-oficina`).
- **Flujo de ramas (documentado en el README raíz):** rama individual por desarrollador (ej. `nombre-usuario`), derivada de `calidad`; merge hacia `calidad` únicamente vía Pull Request, con aprobación de otro integrante (nadie aprueba su propio PR).
- **Ramas encontradas realmente en el repositorio:** `main`, `calidad`, `practicante-desarrollo` (rama activa actual).
- **Convención de commits:** formato `tipo(módulo): descripción`, en modo imperativo (ej. `feat(reservas): agrega endpoint de creación de reserva`) — confirmado también en el historial real de commits (`feat(front)...`, `fix(auth)...`, `feat(db)...`, etc.).
- **Semver / tags / releases:** No hay tags de versión en el repositorio. Los `package.json` de ambos componentes ahora declaran `"version": "1.0.0"` — la API ya la tenía desde antes; el front la tenía en `0.0.0` (valor por defecto de Vite) y fue actualizada por el desarrollador el 2026-09-10 (ver `RISKS.md` R15, Resuelto). No hay todavía una política formal de incremento de versión (SemVer real) más allá de este valor fijo.
- **Regla de repositorio:** "No se comitea código comentado o no utilizado" (documentado en README raíz).

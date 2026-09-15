# Knowledge Base — Reserva de Lugares de Oficina

> **Advertencia:** esta carpeta (`knowledge/`) es la **fuente principal de contexto** del proyecto para desarrolladores y para cualquier IA que trabaje sobre este repositorio en el futuro. Antes de volver a analizar todo el código fuente desde cero, consulta primero estos archivos. Solo vuelve al código para validar huecos, resolver contradicciones o actualizar información que haya cambiado.

## Proyecto

- **Nombre:** Reserva de Lugares de Oficina (`reserva-lugares-oficina`)
- **Descripción breve:** aplicación interna de Verde Valle que permite a los empleados reservar un lugar físico de trabajo en la oficina para una fecha específica, evitando conflictos de asignación de espacios.
- **Objetivo de la documentación:** dejar registro técnico y funcional completo del sistema (frontend, backend, base de datos, seguridad, despliegue) para mantenimiento futuro, onboarding de nuevos desarrolladores y como base para el documento técnico empresarial.
- **Origen de esta base de conocimiento:** generada mediante análisis automatizado del código fuente (repositorio en `C:\Desarrollos\reserva-lugares-oficina\reserva-lugares-oficina`) combinado con contexto funcional proporcionado por el desarrollador responsable (practicantedes@verdevalle.com) el 09/09/2026.

## Estado de la documentación

- **Versión:** 1.4 (cuarta pasada de actualización — cierre de los últimos riesgos técnicos abiertos; ver `CHANGELOG.md`).
- **Estado:** En revisión. Los 15 huecos registrados en `INFORMATION_GAPS.md` fueron respondidos por el desarrollador; todos quedan marcados **Resuelto** o **N/A**. **No queda ningún hueco en estado "Pendiente"** en la base de conocimiento. Todos los riesgos de `RISKS.md` quedan en estado **Mitigado, Resuelto o Aceptado** (decisión de alcance) — no queda ningún riesgo en estado "Pendiente".
- **Última actualización:** 2026-09-10.
- **Autor de esta generación:** Agente de documentación técnica (Claude), a partir de contexto proporcionado por practicantedes@verdevalle.com.

## Cómo navegar esta carpeta

| Archivo | Contenido |
|---|---|
| [PROJECT_MEMORY.md](./PROJECT_MEMORY.md) | Contexto condensado para pegar en futuras conversaciones con IA. |
| [BUSINESS.md](./BUSINESS.md) | Objetivo de negocio, usuarios, flujo funcional, módulos, casos de uso. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Estilo arquitectónico, componentes propios vs. dependencias externas. |
| [FRONTEND.md](./FRONTEND.md) | Detalle interno del frontend: pantallas, componentes, hooks, providers. |
| [BACKEND.md](./BACKEND.md) | Detalle interno del backend: rutas, controllers, services, middlewares. |
| [DATABASE.md](./DATABASE.md) | Modelo de datos, tablas, stored procedures, integridad, backup. |
| [API.md](./API.md) | Catálogo completo de endpoints, request/response, auth. |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | Integraciones externas (Azure AD/MSAL) y su detalle técnico. |
| [SECURITY.md](./SECURITY.md) | Autenticación, autorización, secretos, riesgos de seguridad. |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Entornos, variables de entorno, build, CI/CD, monitoreo, versionado. |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | Dependencias por capa, propósito y comentario técnico. |
| [BUSINESS_RULES.md](./BUSINESS_RULES.md) | Reglas de negocio extraídas del código, clasificadas por módulo. |
| [DECISIONS.md](./DECISIONS.md) | Decisiones arquitectónicas detectadas, con evidencia y riesgos. |
| [RISKS.md](./RISKS.md) | Riesgos técnicos, deuda técnica, clasificados por impacto. |
| [GLOSSARY.md](./GLOSSARY.md) | Glosario de términos del proyecto. |
| [CHANGELOG.md](./CHANGELOG.md) | Registro de cambios futuros a esta documentación. |
| [INFORMATION_GAPS.md](./INFORMATION_GAPS.md) | Información faltante o contradictoria, clasificada por impacto. |

## Documento técnico generado a partir de esta base

- `docs/technical-documentation/documento-tecnico-revision.html` — documento técnico **interno de revisión**, con marcadores "⚠ Requiere revisión". No es el entregable final.
- El documento limpio final (`documento-tecnico.html`) se genera solo cuando el equipo lo solicite explícitamente después de resolver los pendientes de `INFORMATION_GAPS.md`.

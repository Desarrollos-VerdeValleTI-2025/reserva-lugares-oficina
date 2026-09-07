# Reserva de Lugares de Oficina

Proyecto simulado para capacitación (Verde Valle), sin conexión con sistemas en producción. Aplicación para reservar lugares de trabajo en una oficina: ver si ya tienes un lugar apartado, verlo en un mapa, editarlo, cancelarlo, o reservar uno nuevo — con autenticación real vía Azure AD.

Construido en 4 actividades incrementales, cada una siguiendo los estándares de desarrollo de Verde Valle (JavaScript y Bases de Datos):

1. **Frontend simulado** — interfaz en React con datos dummy, sin backend real.
2. **API simulado** — Express con datos en memoria, sin base de datos.
3. **Base de datos real** — MySQL con stored procedures, validada de forma aislada (sin tocar el API).
4. **Integración completa** — el API deja de simular datos y consume MySQL real; el front deja de usar datos dummy y consume el API real; autenticación real con Azure AD (MSAL) de punta a punta.

## Componentes del proyecto

| Carpeta | Qué es | README |
|---|---|---|
| `reserva-lugares-oficina-front/` | Frontend (React + Vite + Ant Design + MSAL) | [Ver README](reserva-lugares-oficina-front/README.md) |
| `reserva-lugares-oficina-api/` | Backend (Node.js + Express, protegido con Azure AD) | [Ver README](reserva-lugares-oficina-api/README.md) |
| `reserva-lugares-oficina-db/` | Base de datos MySQL (`reservalugares`) — scripts SQL, stored procedures | [Ver README](reserva-lugares-oficina-db/README.md) |

## Arquitectura

```
┌─────────────────────┐        HTTPS + token          ┌──────────────────────┐        CALL sp(...)        ┌─────────────────┐
│  Front (React/Vite)  │ ─────────────────────────────▶ │  API (Node/Express)  │ ──────────────────────────▶ │  MySQL           │
│  localhost:5173       │ ◀───────────────────────────── │  localhost:4000       │ ◀────────────────────────── │  reservalugares  │
└─────────────────────┘        JSON {success,data}       └──────────────────────┘        result sets            └─────────────────┘
        │                                                          │
        │  login/logout (MSAL)                                    │  valida el token (audiencia/emisor)
        ▼                                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Azure AD (Microsoft)                        │
│   App Registration del front (login)   +   App Registration del API      │
└─────────────────────────────────────────────────────────────────────────┘
```

El front nunca llama a MySQL directo, y el API nunca toca las tablas directo (solo invoca stored procedures) — cada capa tiene una sola responsabilidad, y ninguna se salta a la siguiente.

## Cómo correr todo el proyecto en local

Se necesitan los tres componentes corriendo a la vez, en este orden:

### 1. Base de datos

Sigue el [README de `reserva-lugares-oficina-db`](reserva-lugares-oficina-db/README.md): correr los scripts numerados en Workbench y crear el usuario `app_reservas_api` acotado.

### 2. Backend

```bash
cd reserva-lugares-oficina-api
npm install
cp .env.example .env   # llenar DB_* y AZURE_AD_* — ver su README
npm run dev
```

### 3. Frontend

```bash
cd reserva-lugares-oficina-front
npm install
cp .env.example .env   # llenar VITE_AZURE_AD_* — ver su README (incluye la guía de Azure AD)
npm run dev
```

Abre `http://localhost:5173`, inicia sesión con tu cuenta de Verde Valle, y ya puedes reservar tu lugar.

## Contrato de datos (fijo desde la Actividad 1)

El contrato entre front y backend no cambió en ninguna de las 4 actividades:

- `GET /api/seats?date=YYYY-MM-DD` — grid completo de lugares con su estado para esa fecha.
- `GET /api/reservations/me` — reservas activas del usuario autenticado (por token, no por parámetro).
- `POST /api/reservations` — body `{ seatId, date }`, crea una reserva.
- `PUT /api/reservations/:id` — body `{ seatId, date }`, reprograma una reserva existente.
- `DELETE /api/reservations/:id` — cancela una reserva (lógicamente, no se borra el registro).

**Forma de un lugar:** `{ "id": 2, "code": "A2", "row": 1, "column": 2, "status": "disponible" }`

**Forma de una reserva:** `{ "id": 10, "seatId": 2, "seatCode": "A2", "date": "2026-09-01", "userEmail": "..." }`

**Formato de respuesta del API:** éxito `{ success: true, data: {...} }`, error `{ success: false, error: { code, message } }`.

## Convenciones de repositorio

- Rama individual `nombre-usuario`, derivada de `calidad`.
- Commits en formato `tipo(módulo): descripción`, en modo imperativo (ej. `feat(reservas): agrega endpoint de creación de reserva`).
- Merge hacia `calidad` únicamente vía Pull Request, con aprobación de otro integrante — nadie aprueba su propio PR.
- No se comitea código comentado o no utilizado.

## Responsable

PracticanteDesarrolloVV (practicantedes@verdevalle.com)

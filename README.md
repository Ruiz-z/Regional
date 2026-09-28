# SmartRiego MX

Plataforma IoT de agricultura de precisión: decide cuándo y cuánto regar **por zona** dentro de cada parcela, y detecta un foco de plaga mediante visión artificial sobre una cámara que simula un dron — actuando directamente (válvulas/bombas, tratamiento simulado con agua) en vez de solo recomendar.

## Stack

Monorepo pnpm + Turborepo:

| App | Stack |
|---|---|
| `apps/api` | NestJS + Prisma + PostgreSQL |
| `apps/web` | Next.js + shadcn/ui |
| `apps/mobile` | Expo + Expo Router |
| `apps/vision` | Python (FastAPI) — pipeline de detección de plagas |
| `firmware/` | ESP32 (C++/Arduino) |

`site/` es un mockup estático navegable (HTML+JS vanilla) usado para validar flujos antes de construir `apps/web` — no es la implementación real.

## Requisitos

- Node.js (ver `packageManager` en `package.json`) + pnpm `11.3.0`
- Docker (Postgres local vía `apps/api/docker-compose.test.yml`)
- Python 3.11+ (para `apps/vision`)

## Arrancar en local

```bash
pnpm install

# Postgres local
docker compose -f apps/api/docker-compose.test.yml up -d

# Copiar y completar el .env de cada app (nunca se commitea)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env      # si existe
cp apps/mobile/.env.example apps/mobile/.env
cp apps/vision/.env.example apps/vision/.env

pnpm dev   # levanta apps/api y apps/web en paralelo (turbo)
```

Móvil y visión se levantan aparte:

```bash
cd apps/mobile && npx expo start
cd apps/vision && python run_camera.py   # loop continuo de detección
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta `apps/api` + `apps/web` en paralelo |
| `pnpm build` | Build de todas las apps |
| `pnpm lint` | Lint de todas las apps |
| `pnpm test` | Tests unitarios |
| `pnpm test:integration` | Tests de integración (requiere Postgres real) |
| `python -m pytest` (en `apps/vision`) | Tests del servicio de visión |

## Documentación

- [`AGENTS.md`](AGENTS.md) — guía de convenciones para trabajar en el repo
- [`docs/constitution.md`](docs/constitution.md) — reglas y alcance del proyecto (leer antes de tocar código)
- [`docs/specs/`](docs/specs) — specs funcionales por módulo
- [`docs/permissions.md`](docs/permissions.md) — matriz de permisos por rol
- [`docs/tasks.md`](docs/tasks.md) — seguimiento de tareas

## Roles

Dos roles fijos: **Agricultor** (dueño de sus parcelas/zonas) y **Administrador** (superset — gestión de usuarios, dispositivos e integraciones). Sin registro público: el primer Admin se crea manualmente en la base; el resto de las cuentas se crean vía `POST /users` con un JWT de Admin.

## Despliegue

- `apps/api` y `apps/web`: Vercel, rama `main` como Production. El flujo de cambios es `test` → `dev` → `main` vía PR.
- `apps/vision` y el firmware del ESP32 corren fuera de Vercel (proceso persistente + hardware).

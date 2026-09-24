# Tareas — SmartRiego MX

Fase "Tareas" del flujo SDD, a partir de `docs/constitution.md`, las 7 specs en `docs/specs/` y `docs/plan.md`. El desarrollo corre con **3 subagentes de OpenCode en paralelo**: **BE** (Backend: `apps/api`+`apps/vision`), **FE** (Web: `apps/web`), **AP** (Móvil: `apps/mobile`) — cada tarea usa ese prefijo + número de 3 dígitos para que cada subagente identifique de un vistazo qué le toca. Cada spec se trabaja en su propia rama creada desde `dev` (no desde `main`), con PR hacia `dev` al terminar.

## Convenciones de trabajo

- **3 líneas paralelas (subagentes)**: **BE** (`apps/api` + `apps/vision`), **FE** (`apps/web`), **AP** (`apps/mobile`). Cada uno solo toca su carpeta — evita conflictos de merge entre subagentes.
- **IDs de tarea**: `BE-0XX`, `FE-0XX`, `AP-0XX`, numeración corrida dentro de cada línea (no reinicia por spec).
- **Rama por spec**: `feature/00X-nombre-corto` creada desde `dev` (ej. `feature/004-riego-inteligente`). Si BE/FE/AP trabajan la misma spec en paralelo, cada uno abre su propia rama (`-api`, `-web`, `-mobile` de sufijo) o se coordinan en una — lo obligatorio es que **todas partan de `dev`, nunca de `main`**.
- PR de la rama de spec hacia `dev` al terminar sus tareas + tests en verde. `dev` se mergea a `main` (dispara `deploy.yml`) por lotes, no automáticamente por cada spec.
- **Referencia visual obligatoria** (FE/AP): antes de maquetar cualquier pantalla, revisar el `.html` correspondiente en `site/` — es el layout/copy/estados a replicar con componentes reales, no a rediseñar.

---

## Bootstrap de repo (antes de abrir cualquier rama de spec)

- [ ] **BE-001** — Crear rama `dev` en GitHub desde `main`; protegerla igual o menos estricta que `main`.
  Hecho cuando: `dev` existe en el remoto.
- [ ] **BE-002** — Editar `.github/workflows/ci.yml`: `branches: [main]` → `branches: [dev, main]` en `pull_request`/`push`.
  Hecho cuando: un PR de una rama `feature/*` hacia `dev` dispara CI.

---

# LÍNEA BE (Backend: `apps/api` + `apps/vision`)

## Bootstrap del backend
Rama: `feature/000-bootstrap-backend` desde `dev`.

- [ ] **BE-003** — Scaffold de `apps/api` (NestJS+TS), estructura `src/common/`, `src/config/`, `src/prisma/` vacíos.
  Hecho cuando: `pnpm --filter api start` levanta un Nest app vacío sin errores.
- [ ] **BE-004** — `schema.prisma` completo con los 9 modelos/enums de `plan.md` + primera migración.
  Hecho cuando: `prisma migrate dev` corre sin error y `prisma studio` muestra las 8 tablas.
- [ ] **BE-005** — `docker-compose.test.yml` en `apps/api` + `PrismaModule`/`PrismaService` compartido.
  Hecho cuando: `docker compose -f docker-compose.test.yml up -d` levanta Postgres y un test smoke conecta sin error.
- [ ] **BE-006** — Filtro global de excepciones + interceptor de logging en `src/common/`.
  Hecho cuando: una excepción no controlada devuelve JSON `{statusCode, message}`, no stack trace crudo.

## Identity — Spec 001
Rama: `feature/001-autenticacion` desde `dev`.

- [ ] **BE-007** — `identity.module`, `UsersService` (crear con bcrypt, buscar por email). RF-7.
- [ ] **BE-008** — `POST /auth/login`: JWT `{userId, role}`, expira 24h. RF-1, RF-2.
- [ ] **BE-009** — `JwtAuthGuard` + `RolesGuard` (`@Roles('ADMIN')`) en `src/common/`. RF-3, RF-4, RF-5.
- [ ] **BE-010** — `POST /users` (solo Admin, alta de Agricultor). RF-6.
  Hecho cuando (en orden): hash≠password → login 200/401 correcto → endpoint de prueba 401/403/200 según token/rol → Admin crea Agricultor (201), Agricultor no puede (403).

## Parcels — Spec 002
Rama: `feature/002-parcelas-zonas` desde `dev`.

- [ ] **BE-011** — CRUD `Parcel` (`/parcels`) con `ownerId` del JWT. RF-1.
- [ ] **BE-012** — CRUD `Zone` anidado (`/parcels/:id/zones`). RF-2.
- [ ] **BE-013** — Guard de ownership (Agricultor solo lo suyo, Admin todo). RF-3, RF-4.
- [ ] **BE-014** — Cascada al borrar parcela (zonas) + desvinculación de dispositivos. RF-5.
  Hecho cuando: las 4 combinaciones de rol/ownership responden como en la spec; borrar parcela con zonas+dispositivo deja 0 zonas y el dispositivo sigue existiendo.

## Devices — Spec 003
Rama: `feature/003-dispositivos-iot` desde `dev`.

- [ ] **BE-015** — `POST /devices` (Admin): genera key, guarda hash, la devuelve una vez. RF-1.
- [ ] **BE-016** — `DeviceKeyGuard` (`X-Device-Key`) para endpoints de ingestión. RF-2, RF-3.
- [ ] **BE-017** — Revocar/regenerar key. RF-4.
- [ ] **BE-018** — Online/offline por `lastSeenAt` (>5 min). RF-5.
  Hecho cuando: sin key/con key inválida/revocada → 401 sin persistir; key vieja tras regenerar → 401; dispositivo sin lecturas recientes → offline en `GET /devices`.

## Weather (parte de la spec de riego)
Rama: `feature/004-riego-inteligente` desde `dev`.

- [ ] **BE-019** — Cliente OpenWeather con cache en memoria de 10 min por parcela.
- [ ] **BE-020** — Fallback si OpenWeather falla (no tumba el request que lo llama).
  Hecho cuando: 2 llamadas en 10 min = 1 solo request HTTP real; con el cliente mockeado a fallar, devuelve `null` en vez de lanzar.

## Irrigation — Spec 004
Rama: `feature/004-riego-inteligente` desde `dev` (misma que Weather).

- [ ] **BE-021** — `POST /readings` (`DeviceKeyGuard`): valida rango 0-100%, persiste. RF-1.
- [ ] **BE-022** — Motor de decisión: humedad vs. umbral + pronóstico + score de modelo (stub el score por ahora). RF-2, RF-3.
- [ ] **BE-023** — Respuesta de `/readings` con `{decision, durationMinutes?, reason}`. RF-4.
- [ ] **BE-024** — `POST /irrigation-events` + independencia entre zonas. RF-5, RF-6.
- [ ] **BE-025** — Corrección por lluvia insuficiente en el ciclo siguiente a un `ESPERAR` por lluvia. RF-8.
- [ ] **BE-026** — Anomalía: 3 `REGAR` consecutivos sin subir humedad en la misma zona. RF-9.
  Hecho cuando: humedad de 150% se descarta; humedad baja→REGAR, alta→ESPERAR, sin pronóstico→decide igual; 2 zonas de una parcela deciden independiente; `ESPERAR` por lluvia + sin mejora → `REGAR` con `correctedForRain=true`; 3 riegos sin mejora → anomalía (2 no la disparan).

## Pest — Spec 005
Rama: `feature/005-deteccion-plagas` desde `dev`.

- [ ] **BE-027** — `POST /pest-detections` (`DeviceKeyGuard`) + contador de frames consecutivos por zona. RF-1, RF-2.
- [ ] **BE-028** — Confirmación a los 3 consecutivos + clasificación Normal/Monitoreo/Intervención. RF-3, RF-4.
- [ ] **BE-029** — Tratamiento automático en Intervención + cooldown 10 min. RF-5, RF-6, RF-8.
- [ ] **BE-030** — `POST /zones/:id/treat` (manual): guard rol Agricultor-dueño + guard estado (no Normal) + guard cooldown. RF-9, RF-10.
  Hecho cuando: frame sin detección resetea contador; 3er consecutivo confirma; Intervención dispara tratamiento automático y un 2do a los 5 min no; endpoint manual → 403 Admin, 400/409 zona Normal, 409 cooldown, 201+`trigger:MANUAL` en el caso correcto.

## Notifications — Spec 006
Rama: `feature/006-notificaciones` desde `dev`.

- [ ] **BE-031** — Crear `Notification` desde evento (anomalía/plaga/lluvia) con severidad correcta. RF-1, RF-2, RF-3.
- [ ] **BE-032** — Push (Expo server SDK) + `GET /notifications`. RF-4.
- [ ] **BE-033** — Email vía Resend solo si severidad `CRITICAL`. RF-5.
- [ ] **BE-034** — Emails transaccionales: bienvenida + reset password. RF-6, RF-7.
- [ ] **BE-035** — Cron semanal de resumen por Agricultor. RF-8.
- [ ] **BE-036** — Leído/no leído + listado agregado Admin. RF-9, RF-10.
  Hecho cuando: cada tipo de evento genera severidad correcta; INFO no llama Resend, CRITICAL sí; alta de Agricultor dispara bienvenida; job manual genera resumen por Agricultor; Admin ve notificaciones de 2 Agricultores en un listado.

## Reports — Spec 007
Rama: `feature/007-historico-reportes` desde `dev`.

- [ ] **BE-037** — `GET /parcels/:id/history?from&to`: rango, ownership, eventos del rango. RF-2, RF-5.
- [ ] **BE-038** — Consumo (minutos regados) + ahorro estimado vs. línea base fija. RF-3, RF-4.
  Hecho cuando: rango inválido→400, parcela ajena→403, sin eventos→200 vacío; cálculo con datos conocidos coincide con lo esperado a mano.

## Servicio de visión (`apps/vision`)
Rama: `feature/005-deteccion-plagas-vision` desde `dev` (o incluida en `feature/005-deteccion-plagas` si BE lleva ambas).

- [ ] **BE-039** — Scaffold FastAPI, `requirements.txt`, `/health`, cliente HTTP con la API key del dispositivo hacia `apps/api`.
- [ ] **BE-040** — Pipeline YOLO mínimo: inferencia sobre un frame de prueba, mapeo a zona por cuadrante fijo.
- [ ] **BE-041** — Loop: cámara → inferencia → `POST /pest-detections`.
  Hecho cuando: `/health` responde 200; imagen de prueba → zona/conteo correctos; corriendo contra backend real, cada frame genera un request registrado.

---

# LÍNEA FE (Web: `apps/web`)

Todas las pantallas ya tienen su referencia exacta en `site/*.html` (markup, copy, estados) — construir con Next.js+shadcn replicando esa UI. Patrón `app/` (rutas) → `features/<dominio>/` (lógica) → `shared/` de `Recursos/Arquitectura de referencia`.

## Auth + layout — Spec 001
Rama: `feature/001-autenticacion-web` desde `dev`. Depende de BE-008/BE-009 (o mockear mientras tanto).

- [ ] **FE-001** — `app/(auth)/login/page.tsx`: réplica de `site/index.html`, llama `POST /auth/login`, guarda el JWT.
- [ ] **FE-002** — Layout `app/(dashboard)/layout.tsx`: guard de sesión + menú condicionado por `role`.
  Hecho cuando: sin sesión, `(dashboard)` redirige a `/login`; con sesión, el menú Admin solo aparece si `role=ADMIN`.

## Dashboard principal — Spec 004 + 005 (lectura)
Rama: `feature/004-riego-inteligente-web` desde `dev`. Depende de BE-023/BE-024.

- [ ] **FE-003** — `features/dashboard/`: selector de parcela — réplica de `site/dashboard.html`.
- [ ] **FE-004** — Gráficas de humedad/consumo (skill `dataviz`), resumen de plagas, alertas activas.
  Hecho cuando: cambiar el selector actualiza gráficas y alertas sin recargar.

## Detalle de parcela/zona — Spec 004 + 005
Rama: misma `feature/004-riego-inteligente-web`. Depende de BE-023/BE-024, BE-028/BE-029/BE-030.

- [ ] **FE-005** — `features/parcels/parcel-detail`: plano de zonas (grid) — réplica de `site/parcela.html`.
- [ ] **FE-006** — Panel de zona + botón "Activar tratamiento" — visible/habilitado **solo si `role=AGRICULTOR` dueño** y estado Monitoreo/Intervención; llama `POST /zones/:id/treat`.
  Hecho cuando: Agricultor dueño con zona en Monitoreo ve el botón habilitado y funcional; Admin no lo ve en absoluto (no solo disabled).

## Notificaciones — Spec 006
Rama: `feature/006-notificaciones-web` desde `dev`. Depende de BE-031/BE-032/BE-036.

- [ ] **FE-007** — `features/notifications`: listado con severidad informativa/crítica distinta — réplica de `site/notificaciones.html`; marcar leído al abrir.
  Hecho cuando: crítica se ve visualmente distinta de informativa; el estado leído persiste tras recargar.

## Histórico y reportes — Spec 007
Rama: `feature/007-historico-reportes-web` desde `dev`. Depende de BE-037/BE-038.

- [ ] **FE-008** — `features/reports`: gráficas de consumo/ahorro, timeline, filtro por parcela/zona/fecha — réplica de `site/historico.html`.
  Hecho cuando: cambiar el rango dispara nueva consulta a `GET /parcels/:id/history` y actualiza gráficas.

## Admin — usuarios, dispositivos, configuración
Rama: `feature/admin-web` desde `dev`. Depende de BE-010, BE-015/BE-017/BE-018.

- [ ] **FE-009** — `features/users` (solo Admin): listar/crear Agricultores — réplica de `site/admin-usuarios.html`.
- [ ] **FE-010** — `features/devices` (solo Admin): listar dispositivos, online/offline, generar/revocar key — réplica de `site/admin-dispositivos.html`.
- [ ] **FE-011** — `features/config` (solo Admin): umbrales globales, keys de integraciones.
  Hecho cuando: un Agricultor no puede acceder a estas 3 rutas (redirect/403), un Admin sí.

## Gestión de mis parcelas/zonas — Spec 002 (Agricultor)
Rama: `feature/002-parcelas-zonas-web` desde `dev`. Depende de BE-011/BE-012.

- [ ] **FE-012** — `features/parcels/manage`: CRUD de parcela y zonas — réplica de `site/gestion-parcelas.html`.
  Hecho cuando: crear/editar/borrar parcela y zonas funciona end-to-end contra el backend real.

---

# LÍNEA AP (Móvil: `apps/mobile`, Expo, solo Agricultor)

Referencia visual: `site/m-*.html`. Mismo patrón `app/`→`features/`→`shared/`.

## Login + navegación — Spec 001
Rama: `feature/001-autenticacion-mobile` desde `dev`.

- [ ] **AP-001** — Pantalla login (`app/login.tsx`) — réplica de `site/index.html` adaptada a mobile.
- [ ] **AP-002** — `app/(private)/_layout.tsx`: guard de sesión + tabs (Inicio/Notificaciones/Perfil).
  Hecho cuando: sin sesión no se entra a `(private)`; con sesión, los tabs navegan bien.

## Inicio + detalle de parcela/zona — Spec 004 + 005
Rama: `feature/004-riego-inteligente-mobile` desde `dev`. Depende de BE-023/BE-024, BE-028/BE-029/BE-030 (igual que FE).

- [ ] **AP-003** — `features/home`: lista de parcelas con badge agregado — réplica de `site/m-inicio.html`.
- [ ] **AP-004** — `features/parcel-detail`: lista de zonas — réplica de `site/m-parcela.html`.
- [ ] **AP-005** — `features/zone-detail`: humedad/temp/estado + botón "Activar tratamiento" (mismas reglas que FE-006) — réplica de `site/m-zona.html`.
  Hecho cuando: tap parcela→zona navega bien; el botón respeta las mismas reglas de rol/estado/cooldown que en web.

## Notificaciones + push — Spec 006
Rama: `feature/006-notificaciones-mobile` desde `dev`.

- [ ] **AP-006** — `features/notifications`: feed — réplica de `site/m-notificaciones.html`, deep-link a zona desde push (`expo-notifications`).
  Hecho cuando: tocar una notificación push (real o simulada) abre directo la zona correspondiente.

## Perfil
Rama: incluida en `feature/001-autenticacion-mobile`.

- [ ] **AP-007** — `features/profile`: datos de cuenta, cambio de password, permisos de notificaciones.
  Hecho cuando: cambiar el password funciona end-to-end contra el endpoint correspondiente.

---

## Verificación general
- Cada tarea es "hecha" cuando su "Hecho cuando" se cumple Y sus tests (BE) están en verde.
- Antes de abrir PR de una rama de spec hacia `dev`: `pnpm lint`+`pnpm test` (BE) o `pnpm lint` (FE/AP); si se tocó `site/`, correr `python3 site/build.py`.
- Al completar BE+FE+AP: correr el checklist "Criterios de listo para demo" de `constitution.md` de punta a punta (simulando ESP32/visión con `curl`/Postman si el hardware no está listo).

# Plan técnico — SmartRiego MX

Fase "Plan" del flujo SDD: módulos, modelo de datos, decisiones de arquitectura (con alternativa descartada) y estrategia de tests, a partir de `docs/constitution.md` y las 7 specs en `docs/specs/`.

## Módulos (backend NestJS, por dominio)

```
src/
├── common/            # JwtAuthGuard, RolesGuard, DeviceKeyGuard, filtro de excepciones, interceptor de logging
├── config/            # env tipado: JWT secret, OpenWeather key, Resend key, DATABASE_URL
├── prisma/            # PrismaModule/PrismaService compartido
└── modules/
    ├── identity/       # Spec 001 — auth (login, JWT), users (alta de Agricultor por Admin)
    ├── parcels/        # Spec 002 — parcels + zones (CRUD, ownership)
    ├── devices/        # Spec 003 — registro/revocación de dispositivos (ESP32 y servicio de visión), validación de API key
    ├── irrigation/     # Spec 004 — ingestión de lecturas, motor de decisión, irrigation-events
    ├── weather/        # cliente de OpenWeather (usado por irrigation), con cache corto en memoria
    ├── pest/           # Spec 005 — recibe detecciones del servicio de visión, confirmación temporal, pest-treatments (automático + POST /zones/:id/treat manual, guard de rol+estado+cooldown)
    ├── notifications/  # Spec 006 — creación de notificaciones, push (Expo), email (Resend)
    └── reports/        # Spec 007 — histórico agregado, cálculo de ahorro
```

**Servicio de visión** (`apps/vision/`, fuera del monorepo Node): microservicio Python (FastAPI) independiente, con su propio `requirements.txt`. Corre YOLO sobre los frames de la cámara y llama a `POST /pest-detections` del backend usando una API key de dispositivo (mismo mecanismo de Spec 003, ya no exclusivo de hardware ESP32). Se despliega como un contenedor más en la misma VM de Azure (`infra/docker-compose.azure.yml`), no como hardware dedicado.

Web (Next.js, `apps/web/src/features/`): `auth`, `dashboard` (con selector de parcela), `parcels`, `devices`, `users`, `config`, `notifications`, `reports` — un feature por pantalla/grupo de pantallas de la ficha técnica.

Móvil (Expo, `apps/mobile/features/`): `login`, `home`, `parcel-detail`, `zone-detail`, `notifications`, `profile` — igual patrón `app/` (rutas) → `features/` (lógica) → `shared/` (transversal).

**Nota**: `site/` (mockup estático HTML+JS ya generado con `build.py`) y `design/canvas/` (prototipos `.dc.html`) ya validan la UI de casi todas estas pantallas — sirven de referencia visual/de interacción directa para implementar `apps/web`/`apps/mobile`, no hay que re-diseñar desde cero.

## Modelo de datos (Prisma / Postgres)

```prisma
enum UserRole {
  AGRICULTOR
  ADMIN
}

enum DeviceType {
  ESP32
  VISION_SERVICE
}

enum IrrigationDecision {
  REGAR
  ESPERAR
}

enum NotificationType {
  RAIN_CORRECTION     // Spec 006 RF-1
  IRRIGATION_ANOMALY  // Spec 006 RF-2
  PEST_ALERT          // Spec 006 RF-3
}

enum NotificationSeverity {
  INFO
  CRITICAL
}

enum TreatmentTrigger {
  AUTOMATIC
  MANUAL
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         UserRole
  createdAt    DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt    DateTime  @updatedAt @db.Timestamptz(3)

  parcels       Parcel[]
  notifications Notification[]

  @@map("users")
}

model Parcel {
  id        String   @id @default(uuid())
  ownerId   String
  owner     User     @relation(fields: [ownerId], references: [id])
  name      String
  location  String
  crop      String
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  zones Zone[]

  @@index([ownerId])
  @@map("parcels")
}

model Zone {
  id                String   @id @default(uuid())
  parcelId          String
  parcel            Parcel   @relation(fields: [parcelId], references: [id], onDelete: Cascade)
  name              String
  humidityThreshold Float
  createdAt         DateTime @default(now()) @db.Timestamptz(3)
  updatedAt         DateTime @updatedAt @db.Timestamptz(3)

  devices          Device[]
  readings         Reading[]
  irrigationEvents IrrigationEvent[]
  pestDetections   PestDetection[]
  pestTreatments   PestTreatment[]
  notifications    Notification[]

  @@index([parcelId])
  @@map("zones")
}

model Device {
  id          String     @id @default(uuid())
  type        DeviceType
  zoneId      String
  zone        Zone       @relation(fields: [zoneId], references: [id])
  apiKeyHash  String     @unique
  revokedAt   DateTime?  @db.Timestamptz(3)
  lastSeenAt  DateTime?  @db.Timestamptz(3)
  createdAt   DateTime   @default(now()) @db.Timestamptz(3)

  @@index([zoneId])
  @@map("devices")
}

model Reading {
  id          String   @id @default(uuid())
  zoneId      String
  zone        Zone     @relation(fields: [zoneId], references: [id])
  humidity    Float
  temperature Float
  createdAt   DateTime @default(now()) @db.Timestamptz(3)

  @@index([zoneId, createdAt])
  @@map("readings")
}

model IrrigationEvent {
  id               String             @id @default(uuid())
  zoneId           String
  zone             Zone               @relation(fields: [zoneId], references: [id])
  decision         IrrigationDecision
  durationMinutes  Int?
  reason           Json               // {humidity, forecast, modelScore}
  correctedForRain Boolean            @default(false)  // Spec 004 RF-8
  createdAt        DateTime           @default(now()) @db.Timestamptz(3)

  @@index([zoneId, createdAt])
  @@map("irrigation_events")
}

model PestDetection {
  id        String   @id @default(uuid())
  zoneId    String
  zone      Zone     @relation(fields: [zoneId], references: [id])
  count     Int
  frameAt   DateTime @db.Timestamptz(3)
  createdAt DateTime @default(now()) @db.Timestamptz(3)

  @@index([zoneId, createdAt])
  @@map("pest_detections")
}

model PestTreatment {
  id          String           @id @default(uuid())
  zoneId      String
  zone        Zone             @relation(fields: [zoneId], references: [id])
  trigger     TreatmentTrigger // Spec 005 RF-7/RF-9: automático o activado por el Agricultor
  triggeredBy String?          // userId del Agricultor si trigger=MANUAL, null si AUTOMATIC
  executedAt  DateTime         @db.Timestamptz(3)
  createdAt   DateTime         @default(now()) @db.Timestamptz(3)

  @@index([zoneId, createdAt])
  @@map("pest_treatments")
}

model Notification {
  id        String               @id @default(uuid())
  userId    String
  user      User                 @relation(fields: [userId], references: [id])
  zoneId    String?
  zone      Zone?                @relation(fields: [zoneId], references: [id])
  type      NotificationType
  severity  NotificationSeverity
  read      Boolean              @default(false)
  createdAt DateTime             @default(now()) @db.Timestamptz(3)

  @@index([userId, read])
  @@map("notifications")
}
```

**Nota de convención** (ver `Recursos/Modelo de datos con Prisma` del vault): UUID + `Timestamptz(3)` + `@@map` snake_case, igual que el patrón de referencia. **No se usa el patrón multi-tenant de FK compuesta** (`[id, organizationId]`) — ver Decisión 1.

## Decisiones (con alternativa descartada)

1. **Ownership simple (`Parcel.ownerId`) en vez de multi-tenant con FK compuesta.**
   Elegido: FK simple `ownerId → User.id`, chequeo de propiedad en el service layer.
   Descartado: el patrón `@@unique([id, organizationId])` de `Recursos/Arquitectura de referencia` (multi-tenant real con `Organization`).
   Por qué: la constitución (#5) no pide multi-tenant, solo "Agricultor dueño de sus parcelas + Administrador ve todo" — meter una entidad `Organization` sería sobre-ingeniería para dos roles fijos.

2. **Motor de decisión de riego como función síncrona dentro del mismo request de `/readings`, no un job en cola.**
   Elegido: el ESP32 hace `POST /readings` y en la misma respuesta recibe `REGAR`/`ESPERAR` (modelo *pull*, ya definido en Spec 004).
   Descartado: un worker asíncrono (BullMQ+Redis) que evalúa por timer independiente del POST del ESP32.
   Por qué: con ciclo de 1 minuto y HTTP REST simple (constitution #10), una cola agrega infraestructura (Redis) sin beneficio — el ESP32 ya pregunta cada minuto.

3. **Confirmación de plaga con contador simple de frames consecutivos, no ventana de tiempo con SQL.**
   Elegido: por zona, se guarda un contador en memoria/tabla auxiliar que sube con cada detección consecutiva y se resetea si un frame no detecta nada; al llegar a 3 se confirma (Spec 005, ya decidido: 3 frames consecutivos, no ventana).
   Descartado: calcular con una consulta de ventana de tiempo (`WHERE frameAt > now() - interval`) sobre la tabla `pest_detections`.
   Por qué: la regla ya decidida es "consecutivos", no "en una ventana" — un contador es más simple y barato que una agregación por request.

4. **Autenticación de dispositivos con API key estática hasheada, no mTLS.**
   Elegido: `Device.apiKeyHash` (hash de la key, nunca texto plano en DB), enviada en header `X-Device-Key` (Spec 003).
   Descartado: certificados mTLS por dispositivo.
   Por qué: mTLS en firmware ESP32/C++ es semanas de trabajo extra que no aporta a la demo del hackathon; una API key ya cumple constitution #10/#15.

5. **Notificaciones disparadas in-process (NestJS event emitter), no cola de mensajes.**
   Elegido: al crear un `IrrigationEvent` con anomalía o un `PestDetection` que confirma foco, el mismo service dispara la creación de `Notification` + llamada a Expo push SDK + Resend, en el mismo ciclo de vida del request.
   Descartado: publicar un evento a una cola (SQS/RabbitMQ/BullMQ) que un worker separado consume.
   Por qué: el volumen de notificaciones en una demo de hackathon es mínimo; una cola es infraestructura que no se termina de configurar a tiempo y no cambia el resultado visible.

6. **Servicio de visión como microservicio Python en la misma VM de Azure, no una Raspberry Pi dedicada.**
   Elegido: `apps/vision` (FastAPI) corre YOLO y llama a `POST /pest-detections` con una API key de dispositivo (`DeviceType.VISION_SERVICE`), desplegado como contenedor junto a `api`/`web`/`postgres` en `infra/docker-compose.azure.yml`.
   Descartado: Raspberry Pi física dedicada para el pipeline de visión.
   Por qué: evita depender de conseguir/configurar hardware adicional antes de la demo, permite iterar el modelo YOLO en cualquier máquina de desarrollo, y reutiliza la misma VM ya provisionada para el resto del stack — sin sacrificar el principio de constitución de que la detección de plagas sea un servicio separado del backend principal (sigue siendo un proceso independiente, solo que no es hardware dedicado).

7. **Clima consultado en vivo por request, con cache en memoria de ~10 minutos por parcela.**
   Elegido: `weather` module llama a OpenWeather cuando `irrigation` lo necesita, cacheando la respuesta por parcela unos minutos para no exceder el rate limit gratuito.
   Descartado: un cron que pre-descarga el clima de todas las parcelas cada hora.
   Por qué: con pocas parcelas de demo, no hace falta un scheduler adicional; el cache corto ya evita llamadas repetidas en el mismo minuto.

## Estrategia de tests

- **Unitarios** (sin DB real):
  - Motor de decisión de riego (`irrigation` service): casos de humedad baja/alta, con/sin pronóstico de lluvia, con/sin fallo de OpenWeather (Spec 004 RF-3, RF-8).
  - Confirmación temporal de plaga (`pest` service): secuencias de frames con y sin 3 consecutivos, reseteo al fallar un frame (Spec 005 RF-2, RF-3, RF-6).
  - Cálculo de anomalía de riego: 3 ciclos sin subir humedad (Spec 004 RF-9).
  - Cálculo de ahorro estimado (`reports`): comparación contra línea base (Spec 007 RF-4).

- **Integración** (Postgres real vía `docker-compose.test.yml`, mismo patrón que `ci.yml`):
  - `POST /readings` y `POST /pest-detections`: rechazo sin `X-Device-Key` válida (Spec 003 RF-2/RF-3), persistencia correcta.
  - `POST /auth/login`: JWT válido con `role` correcto, 401 en credenciales inválidas (Spec 001 RF-1/RF-2).
  - Ownership: un Agricultor no puede leer/editar parcela de otro (Spec 002 RF-3), Administrador sí puede cualquiera (RF-4).
  - Flujo completo de notificación: crear un `PestDetection` que confirma foco → verificar que se crea `Notification` con severidad `CRITICAL` (Spec 006 RF-3/RF-5).
  - `POST /zones/:id/treat`: 403 si lo llama un Administrador (RF-10), 400/409 si la zona está en `Normal` (RF-9), 409 si está en cooldown (RF-8), 201 + `PestTreatment{trigger: MANUAL}` en el caso correcto.

- **Manual/demo** (constitution.md "Criterios de listo para demo"): las 2 zonas físicas riegan solas, una plaga simulada se detecta+confirma+trata solo en su zona, dashboard muestra ambos módulos en vivo, login diferenciado por rol.

## Cobertura de RF por módulo

| Módulo | Specs/RF que cubre |
|---|---|
| `identity` | Spec 001 (RF-1 a RF-7) |
| `parcels` | Spec 002 (RF-1 a RF-5) |
| `devices` | Spec 003 (RF-1 a RF-5) |
| `irrigation` + `weather` | Spec 004 (RF-1 a RF-9) |
| `pest` | Spec 005 (RF-1 a RF-10, incluye tratamiento manual del Agricultor) |
| `notifications` | Spec 006 (RF-1 a RF-10) |
| `reports` | Spec 007 (RF-1 a RF-5) |

## Despliegue: preproducción vs producción

Dos entornos, dos ramas, dos destinos — no se reemplaza el plan de `constitution.md` #14, se le agrega un escalón previo:

- **Preproducción (rama `test`)**: espejo de `dev` para validar cambios "arriba" antes de tocar `main`.
  - **Frontend** (`apps/web`): Vercel, gestionado directamente por el equipo (fuera de CI/CD de este repo) — Vercel construye con su propio pipeline de Next.js, no usa `apps/web/Dockerfile`.
  - **Backend** (`apps/api` + Postgres administrada): Railway, deploy automático en cada push a `test`, build a partir de `apps/api/Dockerfile` (contexto: raíz del repo, para tener acceso a `pnpm-lock.yaml`/`pnpm-workspace.yaml`). Variables de entorno = las mismas de `apps/api/.env.example` (`DATABASE_URL` la da Railway al crear la Postgres del proyecto; el resto se configuran a mano en el dashboard: `JWT_SECRET`, `JWT_EXPIRES_IN`, `OPENWEATHER_API_KEY`, `OPENWEATHER_BASE_URL`, y una vez esté mergeado `feature/006-notificaciones`, también `RESEND_API_KEY`/`RESEND_FROM_EMAIL`). El `Dockerfile` corre `prisma migrate deploy` antes de levantar el server, así que las migraciones se aplican solas en cada deploy.
  - `apps/vision` no se despliega en Railway por ahora (requiere cámara física); se sigue probando localmente o contra el backend de `test` vía `API_BASE_URL`.

- **Producción (rama `main`)**: sin cambios respecto a `constitution.md` #14 — VM de Azure con `infra/docker-compose.azure.yml` (postgres+api+web+vision en contenedores), desplegado por `deploy.yml` vía SSH en cada push a `main`. Este camino queda listo (Dockerfiles de `apps/api`/`apps/web` ya existen, `docker-compose.azure.yml` corregido) pero no es el foco mientras se valida en `test`/Railway.

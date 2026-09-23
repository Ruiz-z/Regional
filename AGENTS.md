# AGENTS.md — <proyecto>

## Proyecto
<Qué es, en 2-3 frases. Arquitectura, tecnologías..>

## Comandos
- Ejecutar: `<comando>`
- Tests: `<comando>`
- Lint/formato: `<comando>`

## Estilo y convenciones
# Arquitectura de referencia (de proyectos de trabajo)

No copiar/pegar código — usar esta estructura como guía mental al armar el proyecto del hackathon desde cero. Basado en `okaios-platform` y `okai-platform` (`~/work/okai`).

## Backend — (NestJS + Prisma + Postgres)

**Patrón:** módulos por dominio de negocio (no por tipo técnico), cada módulo autocontenido.

```
src/
├── common/          # decorators, dto, filters, interceptors, middleware, swagger, types
├── config/          # config tipada (env vars)
├── health/          # healthcheck endpoint
├── prisma/          # PrismaModule/PrismaService compartido
├── test-utils/       # helpers para tests
└── modules/
    └── <dominio>/              # ej: identity-access, branches, menu-catalog
        ├── <dominio>.module.ts
        ├── <feature>.controller.ts
        ├── <feature>.service.ts
        ├── <feature>.service.spec.ts       # unit test junto al service
        ├── <feature>.integration-spec.ts   # test de integración
        ├── dto/
        ├── entities/
        └── auth/ (si aplica)               # sub-features anidadas dentro del módulo
```

**Ideas clave a replicar:**
- Cada módulo de negocio = 1 carpeta con controller + service + dto + entities + tests, todo junto (no separar por capas globales tipo `controllers/`, `services/`).
- `common/` centraliza lo transversal: filtro global de excepciones, interceptor de logging, decorators custom (`@CurrentUser()`, etc).
- Prisma como único punto de acceso a datos, con su propio módulo inyectable.
- Auth (JWT + guards + permissions) vive **dentro** del módulo de identidad, no como algo aparte a nivel raíz.
- `docker-compose.yml` + `docker/postgres/init` para levantar la DB de un comando.
- Carpeta `frontend-integration/` con un `.md` por dominio documentando los endpoints para que el frontend no tenga que leer código — vale la pena para ir rápido en equipo.

## Web —  (Next.js App Router)

**Patrón:** feature-based, no solo rutas.

```
src/
├── app/                    # SOLO rutas/páginas (App Router), casi sin lógica
│   ├── (auth)/             # route group para páginas públicas
│   ├── (backoffice)/       # route group para páginas privadas
│   └── api/                # route handlers si hacen falta
├── features/
│   └── <feature>/          # ej: auth, menu, rh, sucursales
│       └── (components, hooks, actions, schemas propios de esa feature)
└── shared/
    ├── auth/
    ├── components/         # UI compartida (shadcn ya vive acá)
    ├── hooks/
    ├── lib/
    └── providers/          # TanStack Query, contexts globales
```

**Ideas clave a replicar:**
- `app/` es solo enrutamiento; toda la lógica de UI/datos vive en `features/<algo>/`.
- Route groups `(auth)` / `(backoffice)` para separar layouts públicos vs privados sin ensuciar la URL.
- `shared/` para lo realmente transversal (no meter ahí cosas de una sola feature).
- shadcn/Radix para componentes base + TanStack Query para data fetching + react-hook-form/zod para forms.

## Mobile  (Expo + Expo Router)

**Patrón:** mismo espíritu feature-based que el web, pero con Expo Router basado en archivos.

```
app/                        # rutas (expo-router), un archivo = una pantalla
├── _layout.tsx             # layout raíz (providers, fonts, etc.)
├── login.tsx / register.tsx / onboarding.tsx / splash.tsx
└── (private)/               # route group para pantallas autenticadas
    ├── _layout.tsx          # guard de auth a nivel de grupo
    └── (tabs)/               # bottom tabs anidados

features/
└── <feature>/               # ej: login, comandas, scan-qr, rewards
    ├── actions/              # llamadas a API
    ├── components/
    ├── hooks/
    ├── schemas/              # validación zod de forms
    ├── lib/
    └── skeletons/            # loading states

shared/
├── constants/                # colors, font-sizes, paths
├── contexts/                 # auth-context, network-context
├── hooks/                    # use-push-notifications, use-ota-update
├── lib/                      # axios instance, query-client, auth-session, toast
├── types/                    # tipos de dominio compartidos
└── ui/                       # design system propio (button, input, card, bottom-sheet...)
```

**Ideas clave a replicar:**
- Igual separación `app/` (solo rutas) vs `features/` (lógica) vs `shared/` (transversal) que en el web — mismo mental model en las 3 capas del proyecto.
- `(private)/_layout.tsx` como guard central de autenticación (redirige si no hay sesión), en vez de chequear auth en cada pantalla.
- `shared/ui/` como mini design-system propio construido sobre primitivos (no un UI kit externo completo) — barato de armar y consistente.
- Networking: axios + TanStack Query + contexto de auth con `expo-secure-store` para tokens.
- Cosas nativas ya resueltas ahí si el reto las necesita: cámara/QR (`scan-qr`), push notifications, bottom sheets, animaciones con lottie.

## Reglas de las 3 capas (patrón común)
1. **Rutas separadas de lógica**: páginas/pantallas casi vacías, delegan a `features/`.
2. **Feature-based, no layer-based**: agrupar por dominio de negocio, no por tipo de archivo.
3. **`shared/` solo para lo realmente transversal**: si algo se usa en una sola feature, vive en esa feature.
4. **Auth como guard centralizado**: un layout/middleware que protege un grupo entero de rutas, no checks repetidos.



## Reglas
- Lee docs/constitution.md y la spec activa antes de tocar código.
-Jamas haras un commit  o push sin mi autorizacion
 -siempre leeras la doc para que no te pierdas o no empieces a delirar cosas

## Al terminar cualquier tarea
- <Verificación obligatoria, p. ej. ejecutar los tests.>
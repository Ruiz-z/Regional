# Build context es la raíz del monorepo (ver infra/docker-compose.azure.yml)
# para poder instalar con el pnpm-lock.yaml del workspace.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

# prisma.config.ts resuelve DATABASE_URL al cargar (aunque "prisma generate"
# no necesita conexión real) — placeholder solo para este stage de build,
# el valor real lo inyecta Railway/docker-compose en runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api apps/api
# apps/api tiene "postinstall": "prisma generate" — necesita el schema ya
# copiado (apps/api/prisma/) antes de correr install, no solo el package.json.
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @smartriego/api run build

FROM node:22-slim AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo /repo

WORKDIR /repo/apps/api
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm run start:prod"]

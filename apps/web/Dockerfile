# Build context es la raíz del monorepo (ver infra/docker-compose.azure.yml)
# para poder instalar con el pnpm-lock.yaml del workspace.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo

COPY .npmrc pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
RUN pnpm --filter @smartriego/web run build

FROM node:22-slim AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo /repo

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]

# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

# Default: verify TLS for registry.npmjs.org.
# Corporate/TLS-intercepting networks may need:
#   docker compose build --build-arg ALLOW_INSECURE_NPM_SSL=true
# or in compose: build.args.ALLOW_INSECURE_NPM_SSL: "true"
ARG ALLOW_INSECURE_NPM_SSL=false

RUN if [ "$ALLOW_INSECURE_NPM_SSL" = "true" ]; then \
      npm config set strict-ssl false; \
    fi \
  && npm install -g pnpm@9.15.9

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN if [ "$ALLOW_INSECURE_NPM_SSL" = "true" ]; then \
      pnpm config set strict-ssl false; \
    fi \
  && pnpm install --frozen-lockfile

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm run build && pnpm prune --prod

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

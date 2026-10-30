# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

# Corporate/TLS-intercepting networks break registry.npmjs.org verification
# (UNABLE_TO_GET_ISSUER_CERT_LOCALLY). Keep strict-ssl false so `docker compose build`
# works here; prefer enabling TLS verification in trusted networks when possible.
RUN npm config set strict-ssl false \
  && npm install -g pnpm@9.15.9

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm config set strict-ssl false \
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

# Build stage: installs devDependencies (TypeScript) and compiles; the
# production stage copies out only the result.
FROM node:24-slim AS build

WORKDIR /app

# package files before source, so an unchanged package.json keeps the
# expensive npm ci layer cached
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generating the Prisma client needs the schema, not a database. No
# `prisma migrate deploy` here - there is no database during the build;
# migrations run at container startup (see CMD below).
RUN npx prisma generate && npx tsc --build tsconfig.build.json

# Production stage: only what the server needs at runtime - no TypeScript
# compiler, no devDeps.
FROM node:24-slim AS production

# Prisma needs OpenSSL to talk to the database.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Production dependencies include the prisma CLI, lockfile-pinned - it runs
# `prisma migrate deploy` on container startup (see CMD below).
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# The build stage generated the Prisma client for the build OS; regenerate
# for the production OS (they might differ).
RUN npx prisma generate

# Run as the unprivileged node user (built into the official image) so a
# compromised server process doesn't get root inside the container. The app
# only reads its files, so root-owned COPY output is fine.
USER node

EXPOSE 3000

# shell form (not exec form) so the && works
CMD npx prisma migrate deploy && node dist/index.js

# --- Stage 1: "build" ---
# This stage installs ALL dependencies (including devDependencies like
# TypeScript) and compiles the source code. Think of it as a temporary
# workshop - we build here, then take only the finished product.
FROM node:24-slim AS build

WORKDIR /app

# Copy package files first, BEFORE copying source code.
# Docker caches each step (layer). If package.json hasn't changed,
# Docker skips the expensive `npm ci` on the next build.
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: "production" ---
# Start fresh from a clean Node image. Only copy what we need to run.
# This keeps the final image small (no TypeScript compiler, no devDeps).
FROM node:24-slim AS production

# Prisma needs OpenSSL to talk to the database.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# `npm ci --omit=dev` installs ONLY production dependencies.
# No TypeScript, no vitest, no eslint - just what the server needs to run.
RUN npm ci --omit=dev

# Copy the compiled JavaScript from the build stage.
# This is the key multi-stage trick: COPY --from=build pulls files from
# the first stage, not from your local machine.
COPY --from=build /app/dist ./dist

# Generate the Prisma client for this platform.
# The build stage generated it for the build OS; this regenerates for
# the production OS (they might differ).
RUN npx prisma generate

EXPOSE 3000

# On startup: run pending database migrations, then start the server.
# Using shell form (not exec form) so the && works.
CMD npx prisma migrate deploy && node dist/index.js

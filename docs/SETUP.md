# Setup

Local development setup for Atlas Univerziteta. For hosting and production configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- Node.js 24.x and npm
- PostgreSQL

You will also need:

- a Resend API key for signup confirmation emails
- GitHub OAuth credentials if you want GitHub login enabled (create them at <https://github.com/settings/developers>)

## Installation

```bash
git clone https://github.com/goran1010/atlas-univerziteta.git
cd atlas-univerziteta
npm run install:all
cp server/.env.example server/.env
cp webapp/.env.example webapp/.env
```

Fill in the server values and adjust the webapp server URL if needed.

## Environment variables

### Server (`server/.env.example`)

- `DATABASE_URL`: PostgreSQL connection string for development
- `TEST_DATABASE_URL`: PostgreSQL connection for server tests (credentials/host only - the suite creates and drops its own databases, so the user needs `CREATEDB` rights)
- `RESEND_API_KEY`: API key for confirmation emails
- `WEBAPP_URL`: webapp origin allowed by credentialed CORS
- `SERVER_URL`: public server base URL used in confirmation links
- `PORT`: server port, usually `3000`
- `COOKIE_SECRET`: session secret
- `NODE_ENV`: runtime mode, usually `development`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL`: optional GitHub OAuth settings

Local callback example: `http://localhost:3000/auth/github/callback`

### Webapp (`webapp/.env.example`)

- `VITE_SERVER_URL`: server base URL used by the React app - `http://localhost:3000` locally, `/server` on Netlify (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- `PRERENDER_API_URL`: optional absolute API URL for the build-time share-page generation (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## Database setup and running

```bash
npm run db:deploy_generate   # migrations + Prisma client
npm run db:seed              # optional seed data
npm run dev:all              # server + webapp together
```

Local defaults: server `http://localhost:3000`, webapp `http://localhost:5173`.

## Testing

```bash
npm run test:all        # server + webapp + e2e
npm run test:server
npm run test:webapp
npm run test:coverage:all
```

Server tests require `TEST_DATABASE_URL` with a user that can `CREATEDB`. The database named in the URL is never used - the test setup creates a fresh template database per run (schema via migrations, no seed data) and a clone per test file, dropping them afterwards.

### E2E and accessibility tests

Playwright drives the real stack (server + webapp) in Chromium, and axe-core scans every public page for WCAG 2.1 A/AA violations:

```bash
npm run test:e2e
npm run test:e2e:ui
```

First run only: install the browser with `npm run install:browsers`.

The suite is self-contained - it boots both apps on dedicated ports (server `3100`, webapp `5273`) and resets + seeds its own `uniatlas_e2e` database (derived from `DATABASE_URL` in `server/.env`, or `E2E_DATABASE_URL` if set), so dev servers and dev data are never touched. On failure, screenshots and traces land in `e2e/test-results/` and a browsable report in `e2e/playwright-report/` (`npm run report` from `e2e/` opens it).

## Quality checks

```bash
npm run lint:all
npm run typecheck:all
npm run format:check:all
npm run spell
```

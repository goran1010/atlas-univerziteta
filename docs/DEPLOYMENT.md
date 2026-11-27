# Deployment

- **Webapp:** Netlify (auto-deploys on push to `main`), serves static files via CDN
- **API + Database:** VPS with Docker Compose (Node.js server, PostgreSQL)
- **Reverse proxy:** Caddy, shared by every app on the VPS, runs in its own stack from the [vps-proxy](https://github.com/goran1010/vps-proxy) repo
- **API access:** the webapp calls `https://api.atlasuniverziteta.com` directly; the apex and the api subdomain are same-site, so session cookies flow without a proxy
- **Security headers:** Netlify serves a strict Content-Security-Policy (no `unsafe-inline`) and the other security headers from `webapp/netlify.toml`
- **HTTPS:** Automatic via Let's Encrypt (Caddy) and Netlify
- **Email:** Resend with a verified custom domain
- **Error tracking and server logs:** Sentry, in the EU data region (see [Error tracking](#error-tracking))

See `.env.production.example` for the VPS environment variable reference and `docker-compose.yml` for the container setup.

In production the `server` service runs the image CI builds and pushes to ghcr, instead of building on the VPS. The committed `docker-compose.prod.yml` override switches the service to that image, and every compose command on the VPS passes both files:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The deploy job does this automatically. Note that explicit `-f` flags make compose ignore any `docker-compose.override.yml` - a VPS set up before `docker-compose.prod.yml` was committed can delete that file.

Caddy reaches the server over `web`, an external Docker network shared by every app on the VPS and the vps-proxy stack. The server joins it under the alias `atlas-server`, since other apps' services on `web` may also be called `server`; Postgres stays on the project's own network. Compose does not create `web`, so starting the server, including through the seed and refold scripts, fails until it exists: on a new VPS, create it once with `docker network create web`, as the vps-proxy README describes.

OAuth callbacks go directly to the API domain (better-auth builds them from `SERVER_URL`). Register these redirect URIs in the GitHub and Google OAuth app settings:

```text
https://api.atlasuniverziteta.com/api/auth/callback/github
https://api.atlasuniverziteta.com/api/auth/callback/google
```

## Error tracking

The webapp and the server report to [Sentry](https://sentry.io): one organization in the EU data region, with a project for each. Each reports only when its DSN is set, so local development, tests and deploy previews send nothing.

### Webapp

The webapp reports only when `VITE_SENTRY_DSN` is set at build time, and only Netlify's Production context sets it.

These become Sentry issues:

- uncaught errors and unhandled promise rejections
- every `console.error` call, so use `console.error` only for what needs fixing and `console.warn` for expected failures
- a route chunk that fails to load, for example in a tab opened before a deploy

These are left out:

- network failures (`Failed to fetch` and its Firefox and Safari wordings): the visitor's connection, not a bug
- errors thrown by browser extensions
- request bodies: sign-in and sign-up bodies carry passwords
- query parameters with sensitive names such as `token`, which the SDK blanks; others, such as the search term `q`, are kept

IP addresses and user agents are sent. Visitors whose ad blocker blocks Sentry do not report.

The build publishes source maps next to the bundles, and Sentry fetches them from the site to show TypeScript files and lines in stack traces. An error from a tab opened before the latest deploy may stay minified, because Netlify no longer serves that deploy's files.

### Server

The server reports only when `SENTRY_DSN` is set on the VPS. It sends every log line to Sentry Logs, which keeps 30 days, so the history survives deploys (the local Docker log does not, see [Logs](#logs)).

These become Sentry issues:

- every error-level log line (`logger.error`), so use `logger.error` only for what needs fixing and `logger.warn` for expected failures
- uncaught exceptions and unhandled promise rejections; their `fatal` log line goes to Sentry Logs only, so a crash is one issue
- better-auth's errors that carry an exception. Its error lines without one, mostly client mistakes such as an invalid `callbackURL` and sometimes carrying the client's input, stay in the logs without opening an issue

These are left out:

- cookies
- request and response bodies, incoming and outgoing: sign-in bodies carry passwords, the OAuth token exchange carries the client secret, and emails carry links with tokens
- query strings: the SDK's name filter would not catch OAuth's `code` and `state`
- the password-reset token in the path, replaced with `[redacted]` in event URLs and transaction names

IP addresses, user agents and other request headers are sent; the SDK blanks headers with names such as `Authorization` or `Cookie`. Caddy's and Postgres's logs stay on the VPS.

### Setting up the webapp project

1. Create a Sentry organization and choose the EU data region; the region is chosen when the organization is created
2. Create a React project and copy its DSN
3. In Netlify, add the `VITE_SENTRY_DSN` environment variable with the DSN, scoped to the Production context only, then trigger a deploy
4. `connect-src` in the Content-Security-Policy in `webapp/netlify.toml` allows the organization's ingest host (`https://o<organization id>.ingest.de.sentry.io`, the host part of the DSN); a different organization needs it updated
5. Add an alert rule that emails on every new issue
6. In the project settings, keep "Prevent storing of IP addresses" off and JavaScript source fetching on (the default)

To check it works, run this in the browser console on the live site; the error shows up in Sentry within a minute:

```js
setTimeout(() => {
  throw new Error("Sentry test");
});
```

### Setting up the server project

1. In the same organization, create a Node.js project (Express) and copy its DSN
2. On the VPS, add `SENTRY_DSN=<the DSN>` to `.env`, then recreate the server container so it picks it up: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
3. Add an alert rule that emails on every new issue

To check it works, send a test error from the running container; it shows up in Sentry within a minute:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec server node --input-type=module -e 'const Sentry = await import("@sentry/node"); Sentry.init({ dsn: process.env.SENTRY_DSN }); Sentry.captureException(new Error("Sentry test")); await Sentry.close(2000);'
```

### Uptime check

An outside check on `https://api.atlasuniverziteta.com/health` catches what nothing else reports: when the server, Caddy or the whole VPS is down, the server cannot report, Caddy's 502s stay in its local log, and the webapp ignores network failures. It checks `/health` rather than `/` because `/health` also queries the database and answers 503 when Postgres is unreachable. Sentry opens an issue only after several failed checks in a row, so the few seconds of 502s during a deploy go unreported.

To set it up, add an uptime monitor to the server project in Sentry (the free plan includes one) for `https://api.atlasuniverziteta.com/health`, checking every few minutes, and make sure its alert emails you. To see it alert, stop the server outside busy hours until the email arrives, then start it again:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop server
docker compose -f docker-compose.yml -f docker-compose.prod.yml start server
```

## Logs

Each container on the VPS writes its logs to Docker, which keeps up to 50 MB per service (5 files of 10 MB, oldest dropped first) and deletes them with the container. Every deploy that ships a new server image recreates the server container, so its local log starts over; with `SENTRY_DSN` set, the server's lines are also in Sentry Logs for 30 days (see [Error tracking](#error-tracking)).

- **server:** pino JSON, one object per line - a `Request completed` line per request (method, path, status, duration, IP, user agent), plus warnings, errors, startup and shutdown. Paths never include the query string, and the password-reset token in the path is replaced with `[redacted]`. Successful health checks are not logged
- **caddy:** runs in the vps-proxy stack, so its logs are read from `/root/vps-proxy`. No access log, since the server logs each request. Caddy logs only its own messages: startup, config reloads, certificate renewals, and errors such as a 502 while the server is down. A 502 line includes the full request URL with its query string; cookies and the `Authorization` header are redacted
- **db:** Postgres's own messages: startup, checkpoints, failed connections and SQL errors

To read them on the VPS, add this line to `/root/atlas-univerziteta/.env` once, so plain `docker compose` works inside that directory (the deploy job still passes both files explicitly):

```text
COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
```

Compose reads `.env` from the directory it runs in, so the line does not reach `/root/vps-proxy` or other apps' directories. An exported `COMPOSE_FILE` in the shell profile would apply in every directory, so `docker compose` in the vps-proxy stack would act on this project.

Then, in `/root/atlas-univerziteta`:

```bash
docker compose logs -f server             # follow live
docker compose logs --since 1h server     # the last hour
docker compose logs --tail 200 server db  # the last 200 lines of each
```

And Caddy's, in `/root/vps-proxy`:

```bash
docker compose logs --tail 200 caddy
```

`jq` makes the server's JSON lines readable and filterable, and passes other lines through unchanged (install it with the VPS's package manager if it is missing). pino's levels are 30 info, 40 warn, 50 error and 60 fatal:

```bash
docker compose logs --no-log-prefix server | jq -rR 'fromjson? // .'
docker compose logs --no-log-prefix server | jq -R 'fromjson? | select(.level >= 50)'
```

## Seeding the database

`npm run db:seed` reads JSON files from `server/JSON_files/universities/<COUNTRY>/` and syncs them into the database: new rows are created, existing rows are updated, and rows no longer in the JSON files are deleted (children cascade). `npm run db:reset` drops everything and reapplies the migrations, but does not seed - run `npm run db:seed` after it.

To re-seed production after a data change, pull the latest code on the VPS and run `./server/scripts/seed-prod.sh`.

Full sync: the seed overwrites edits approved in the app and deletes rows added through the app. Re-seed production only while it holds nothing but seed data; once it has in-app changes, adding data needs an additive seed mode, which does not exist yet.

## Refolding search columns

Search matches against `search*` columns that hold folded copies of the searchable fields (lowercase, without diacritics). The app and the seed fill them whenever they write a row, so the columns only go stale when:

- the fold rules change (`server/src/search/fold.ts` or `server/src/search/fields.ts`)
- rows are edited with manual SQL

After either, refold every row once. On the VPS, once the new image is running:

```bash
./server/scripts/refold-prod.sh
```

Locally, `npm run db:refold` does the same against `DATABASE_URL`. Refolding only rewrites the `search*` columns, so it is safe to run again. A re-seed is no substitute: it deletes rows added through the app, and for existing faculties, study programs and tracks it does not rewrite the folded names.

## Adding a country

Country and entity codes are plain strings in the database, validated in application code, so adding a country needs no migration. A country's code is its ISO 3166-1 alpha-3 code, or the widely used user-assigned code where there is none, and it names the data folder and appears in the API.

1. **Server list** - add the code to `COUNTRIES` in `server/src/validation/countries.ts`; the seed, contributions, approval and the v1 API all validate against it
2. **Subdivisions** - only if every university belongs to a subdivision, as BiH's do to its entities: add the country with its subdivision codes to `SUBDIVISIONS` in the same file. The entity is then required for that country and rejected for every other
3. **Search aliases** - add the country's local, English and common names to `COUNTRY_ALIASES` in `server/src/search/aliases.ts`, keyed by the stems the tokenizer produces, and add the phrases to `server/__tests__/unit/search/aliases.test.ts`; add new stems to `.cspell.json` if the spell check flags them
4. **Webapp list** - add the code to `countrySchema`, and the subdivisions to `SUBDIVISIONS`, in `webapp/src/schemas/domain.ts`
5. **Labels** - add the display name under `universitiesPage.countries` in every bundle in `webapp/src/locales/`, and subdivision names under `universitiesPage.entities` and `contribution.entities`; the webapp typecheck fails until every code has its labels
6. **Languages** - if the country's official languages are not program languages yet, add them as in [Adding a study program language](#adding-a-study-program-language)
7. **Data** - create `server/JSON_files/universities/<CODE>/` with one JSON file per university (see [CONTRIBUTING](./CONTRIBUTING.md) for the format); the seed rejects a file whose `country` does not match its folder
8. **Accreditation** - take `authority` and the accreditation dates from the national accreditation body's register; leave a date out rather than guess it
9. **Sources** - credit the accreditation body in the README's data sources list
10. **Verify** - run `npm run db:seed` and `npm run test:all`

Deploy order: the webapp's read schemas accept only the country codes it knows, so an older webapp fails to load a university with a new code. After merging, let both the Netlify and the VPS deploys finish, and only then re-seed production with `./server/scripts/seed-prod.sh` (see the full-sync note in [Seeding the database](#seeding-the-database)).

## Adding a study program language

A study program lists the languages it is taught in as ISO 639 codes, the shortest code each language has (`cnr` for Montenegrin, which has no two-letter code). They are plain strings in the database, so adding a language needs no migration.

1. **Server list** - add the code to `PROGRAM_LANGUAGES` in `server/src/validation/languages.ts`; the seed and contributions validate against it
2. **Search names** - add the language's names in English, Bosnian/Croatian/Serbian, Albanian, Macedonian (in Cyrillic) and Slovenian to `LANGUAGE_NAMES` in `server/src/search/languageNames.ts`, so a search in any site language finds its programs; the server typecheck fails until every code has names
3. **Webapp list** - add the code to `programLanguageSchema` in `webapp/src/schemas/domain.ts`, at the same position as on the server; the contribution form shows the checkboxes in this order
4. **Labels** - add the language's name under `programLanguages` in every bundle in `webapp/src/locales/`; the webapp typecheck fails until every code has its label
5. **Verify** - run `npm run test:all`

The webapp shows a code it does not know yet as the bare code, so program pages keep loading whichever deploy lands first.

## Adding a site language

The interface has one translation bundle per language in `webapp/src/locales/`; the `sr` bundle serves Bosnian, Croatian, Montenegrin and Serbian readers.

1. **Bundle** - copy `en.json` to `webapp/src/locales/<code>.json` and translate every value, keeping the keys. Every bundle is typed as `en.json`, so the typecheck fails while a key is missing. Counted words have `_one`, `_two`, `_few` and `_other` forms: fill each with the form the language uses, since `Intl.PluralRules` picks one per count
2. **Language list** - in `webapp/src/utils/setInitialLanguage.ts`, add the code to `SYSTEM_LANGUAGES`, its BCP 47 tag to `LANGUAGE_TAGS` (with the script when the bare code means another one, as `sr-Latn` does), and the browser language codes that should get it to `BUNDLE_BY_CODE`; then, in `webapp/src/components/Navbar/LanguageSwitcher.tsx`, add the short code the language chip shows to `LANGUAGE_CODES` and the language's name in its own language to `LANGUAGE_NAMES`
3. **Load it** - import the bundle into `translations` in `webapp/src/customHooks/useLanguage.ts`
4. **Switch notice** - add `language.switched.<code>` to every bundle
5. **Search** - add the language's name of every program language to `LANGUAGE_NAMES` in `server/src/search/languageNames.ts`, and its ownership, study cycle and duration words to `server/src/search/aliases.ts` and `server/src/search/tokenize.ts`
6. **Fonts** - if the language needs characters the self-hosted Roboto subsets lack, add that subset to `webapp/public/fonts/` with a `@font-face` block and its `unicode-range` in `webapp/src/styles/index.css`
7. **Tests** - add the code to the tests for `setInitialLanguage`, `useLanguage` and `LanguageSwitcher`
8. **Review** - have a native speaker review the bundle before it is released
9. **Verify** - run `npm run test:all` and open every page in the new language

## Share previews and prerendered meta

The webapp is an SPA, and social crawlers (Discord, Facebook, X) do not run JavaScript. `webapp/scripts/prerender-meta.ts` runs as the last build step and writes a static `dist/<route>/index.html` per page with the right `<title>`, description, and Open Graph tags baked in - Netlify serves those files before falling back to the SPA shell.

Two stages:

1. **Static routes** (`/about`, `/api-docs`, `/login`, `/signup`): titles and descriptions come from `webapp/src/locales/en.json`; each route can have its own share image in `webapp/public/images/og-images/` (1200x630, saved at twice that as 2400x1260 files), falling back to `og-image-home.png` while missing. The home page `/` is not pre-rendered - it is `index.html` itself, so its title, description, and `og-image-home.png` are written directly in `webapp/index.html`, and the text there must match `title.app` and `meta.home` in `en.json`.
2. **Per-entity pages**: the script fetches all universities and faculties from the API and writes a page per `/universities/:id` and `/faculties/:id`, and appends them to `sitemap.xml`. This stage needs an **absolute** API URL at build time - `VITE_API_URL` is an absolute URL in production and is used directly. If the API is unreachable, the stage logs a warning and is skipped - the deploy never fails because of it.

Share metadata is a deploy-time snapshot: renamed or newly added entities get correct previews on the next deploy.

To refresh the share images after a UI change, run `npm run capture-og` in `e2e/`. It screenshots `/`, `/about`, `/api-docs`, `/login`, and `/signup` in English and Serbian, in the dark theme, into `webapp/public/images/og-images/`. The page is laid out 1280px wide, the narrowest width where the navbar shows the site name, and scaled to the share size. It captures the live site by default; to capture changes that are not deployed yet, run the app locally (`npm run dev:all`) and pass its URL: `npm run capture-og -- http://localhost:5173`.

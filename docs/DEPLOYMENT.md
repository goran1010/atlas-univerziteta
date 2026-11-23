# Deployment

- **Webapp:** Netlify (auto-deploys on push to `main`), serves static files via CDN
- **API + Database:** VPS with Docker Compose (Caddy, Node.js server, PostgreSQL)
- **API access:** the webapp calls `https://api.atlasuniverziteta.com` directly; the apex and the api subdomain are same-site, so session cookies flow without a proxy
- **Security headers:** Netlify serves a strict Content-Security-Policy (no `unsafe-inline`) and the other security headers from `webapp/netlify.toml`
- **HTTPS:** Automatic via Let's Encrypt (Caddy) and Netlify
- **Email:** Resend with a verified custom domain

See `.env.production.example` for the VPS environment variable reference and `docker-compose.yml` for the container setup.

In production the `server` service runs the image CI builds and pushes to ghcr, instead of building on the VPS. The committed `docker-compose.prod.yml` override switches the service to that image, and every compose command on the VPS passes both files:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The deploy job does this automatically. Note that explicit `-f` flags make compose ignore any `docker-compose.override.yml` - a VPS set up before `docker-compose.prod.yml` was committed can delete that file.

OAuth callbacks go directly to the API domain (better-auth builds them from `SERVER_URL`). Register these redirect URIs in the GitHub and Google OAuth app settings:

```text
https://api.atlasuniverziteta.com/api/auth/callback/github
https://api.atlasuniverziteta.com/api/auth/callback/google
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
2. **Language list** - in `webapp/src/utils/setInitialLanguage.ts`, add the code to `SYSTEM_LANGUAGES`, its BCP 47 tag to `LANGUAGE_TAGS` (with the script when the bare code means another one, as `sr-Latn` does), and the browser language codes that should get it to `BUNDLE_BY_CODE`; the language select shows it as its code in capitals
3. **Load it** - import the bundle into `translations` in `webapp/src/customHooks/useLanguage.ts`
4. **Switch notice** - add `language.switched.<code>` to every bundle
5. **Search** - add the language's name of every program language to `LANGUAGE_NAMES` in `server/src/search/languageNames.ts`, and its ownership, study cycle and duration words to `server/src/search/aliases.ts` and `server/src/search/tokenize.ts`
6. **Fonts** - if the language needs characters the self-hosted Roboto subsets lack, add that subset to `webapp/public/fonts/` with a `@font-face` block and its `unicode-range` in `webapp/src/styles/index.css`
7. **Tests** - add the code to the tests for `setInitialLanguage`, `useLanguage` and the language select
8. **Review** - have a native speaker review the bundle before it is released
9. **Verify** - run `npm run test:all` and open every page in the new language

## Share previews and prerendered meta

The webapp is an SPA, and social crawlers (Discord, Facebook, X) do not run JavaScript. `webapp/scripts/prerender-meta.ts` runs as the last build step and writes a static `dist/<route>/index.html` per page with the right `<title>`, description, and Open Graph tags baked in - Netlify serves those files before falling back to the SPA shell.

Two stages:

1. **Static routes** (`/about`, `/api-docs`, `/login`, `/signup`): titles and descriptions come from `webapp/src/locales/en.json`; each route can have its own share image in `webapp/public/images/og-images/` (1200x630, captured at 2x as 2400x1260 files), falling back to `og-image-home.png` while missing. The home page `/` is not pre-rendered - it is `index.html` itself, so its title, description, and `og-image-home.png` are written directly in `webapp/index.html`, and the text there must match `title.app` and `meta.home` in `en.json`.
2. **Per-entity pages**: the script fetches all universities and faculties from the API and writes a page per `/universities/:id` and `/faculties/:id`, and appends them to `sitemap.xml`. This stage needs an **absolute** API URL at build time - `VITE_API_URL` is an absolute URL in production and is used directly. If the API is unreachable, the stage logs a warning and is skipped - the deploy never fails because of it.

Share metadata is a deploy-time snapshot: renamed or newly added entities get correct previews on the next deploy.

To refresh the share images after a UI change, run `npm run capture-og` in `e2e/`. It screenshots `/`, `/about`, `/api-docs`, `/login`, and `/signup` in English and Serbian, in the dark theme, into `webapp/public/images/og-images/`. It captures the live site by default; to capture changes that are not deployed yet, run the app locally (`npm run dev:all`) and pass its URL: `npm run capture-og -- http://localhost:5173`.

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

`npm run db:seed` reads JSON files from `server/JSON_files/universities/<COUNTRY>/` and syncs them into the database: new rows are created, existing rows are updated, and rows no longer in the JSON files are deleted (children cascade). `npm run db:reset` drops everything and re-seeds from scratch.

To re-seed production after a data change, pull the latest code on the VPS and run `./server/scripts/seed-prod.sh`.

## Adding a country

Checklist for adding a new country to the platform:

1. **Prisma enum** - add the ISO 3166-1 alpha-3 code to `enum country` in `server/prisma/schema.prisma` and run `npm run db:migrate`
2. **JSON data** - create `server/JSON_files/universities/<CODE>/` with one JSON file per university (see existing files for the format)
3. **Server validation** - add the code to the country enum in `server/src/validation/contributionValidation.ts` (create and edit schemas) and `server/src/validation/v1Validation.ts` (search and list query schemas)
4. **Seed schema** - add the code to the country enum in `server/src/db/seed.ts`
5. **Search aliases** - add local-language aliases (stems the tokenizer produces) to `server/src/search/aliases.ts`
6. **Webapp schema** - add the code to `countrySchema` in `webapp/src/schemas/domain.ts`
7. **Locale maps** - add a display name in both `webapp/src/locales/en.json` and `webapp/src/locales/sr.json` under `universitiesPage.countries` and `contribution.countries`
8. **Entity rule** - if the country has subdivisions like BiH's entities, add them to the entity enum and validation; otherwise the country works without an entity
9. **Accreditation** - research the national accreditation body and add real accreditation dates to the JSON files
10. **Seed and test** - run `npm run db:seed` and `npm run test:all` to verify

## Share previews and prerendered meta

The webapp is an SPA, and social crawlers (Discord, Facebook, X) do not run JavaScript. `webapp/scripts/prerender-meta.ts` runs as the last build step and writes a static `dist/<route>/index.html` per page with the right `<title>`, description, and Open Graph tags baked in - Netlify serves those files before falling back to the SPA shell.

Two stages:

1. **Static routes** (`/search`, `/about`, `/api-docs`, `/login`, `/signup`): titles and descriptions come from `webapp/src/locales/en.json`; each route can have its own share image in `webapp/public/images/og-images/` (1200x630 px), falling back to `og-image-home.png` while missing.
2. **Per-entity pages**: the script fetches all universities and faculties from the API and writes a page per `/universities/:id` and `/faculties/:id`, and appends them to `sitemap.xml`. This stage needs an **absolute** API URL at build time - `VITE_API_URL` is an absolute URL in production and is used directly. If the API is unreachable, the stage logs a warning and is skipped - the deploy never fails because of it.

Share metadata is a deploy-time snapshot: renamed or newly added entities get correct previews on the next deploy.

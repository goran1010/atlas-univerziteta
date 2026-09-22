# Deployment

- **Webapp:** Netlify (auto-deploys on push to `main`), serves static files via CDN
- **API + Database:** VPS with Docker Compose (Caddy, Node.js server, PostgreSQL)
- **Proxy:** Netlify proxies `/server/*` to the API, keeping session cookies first-party
- **HTTPS:** Automatic via Let's Encrypt (Caddy) and Netlify
- **Email:** Resend with a verified custom domain

See `.env.production.example` for the VPS environment variable reference and `docker-compose.yml` for the container setup.

Production GitHub OAuth callback URL:

```text
https://atlasuniverziteta.com/server/auth/github/callback
```

## Share previews and prerendered meta

The webapp is an SPA, and social crawlers (Discord, Facebook, X) do not run JavaScript. `webapp/scripts/prerender-meta.js` runs as the last build step and writes a static `dist/<route>/index.html` per page with the right `<title>`, description, and Open Graph tags baked in - Netlify serves those files before falling back to the SPA shell.

Two stages:

1. **Static routes** (`/search`, `/about`, `/api-docs`, `/login`, `/signup`): titles and descriptions come from `webapp/src/locales/en.json`; each route can have its own share image in `webapp/public/images/og-images/` (1200x630 px), falling back to `og-image-home.png` while missing.
2. **Per-entity pages**: the script fetches all universities and faculties from the API and writes a page per `/universities/:id` and `/faculties/:id`, and appends them to `sitemap.xml`. This stage needs an **absolute** API URL at build time - on Netlify the runtime `VITE_SERVER_URL` is the `/server` proxy path, so set `PRERENDER_API_URL=https://api.atlasuniverziteta.com` in the Netlify build environment. If the API is unreachable, the stage logs a warning and is skipped - the deploy never fails because of it.

Share metadata is a deploy-time snapshot: renamed or newly added entities get correct previews on the next deploy.

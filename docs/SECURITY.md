# Security

How the app defends user-submitted data, from submission to display. All
write endpoints live under `/users` and require a session.

## CSRF

State-changing requests are protected in layers:

1. Session cookies use BetterAuth's default SameSite=Lax, so browsers do not
   attach them to cross-site POST requests.
2. CORS on `/users` and `/api/auth` is credentialed and allows only
   `WEBAPP_URL`; the public `/api` routes use wildcard CORS but carry no
   credentials.
3. `verifyOrigin` (`server/src/auth/verifyOrigin.ts`) rejects any
   state-changing request whose Origin header is present and differs from
   `WEBAPP_URL`. Requests without an Origin header pass, because non-browser
   clients cannot carry browser credentials.
4. BetterAuth additionally checks its own `trustedOrigins` list, set to
   `WEBAPP_URL` (`server/src/config/auth.ts`).

## Input validation

Every write endpoint parses its body with a zod `strictObject` schema
(`server/src/validation/`). Unknown keys are rejected (including
`__proto__` and `constructor`), strings have maximum lengths, and website
URLs must be http or https, which blocks `javascript:` and `data:` URLs.
The same schemas run again when an admin approves a pending change
(`server/src/models/applyPendingChange.ts`), so a row that predates a
validation rule cannot bypass it.

## Output encoding

User-contributed values are stored verbatim and escaped at render time. The
webapp renders through React, which escapes text content. External links go
through `ExternalLink`
(`webapp/src/components/sharedComponents/ExternalLink.tsx`), which renders
any href that is not http(s), mailto or tel as plain text. Prerendered meta
tags escape HTML and interpolate values with replacer functions
(`webapp/scripts/prerender-meta-lib.ts`).

## Rate limiting

All API routes are rate limited per IP (`server/src/utils/rateLimiter.ts`),
with stricter limits on auth endpoints.

## Headers

The server sets security headers with helmet. The webapp is served by
Netlify with a strict Content-Security-Policy and related headers
(`webapp/netlify.toml`).

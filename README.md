# Atlas Univerziteta

**English** | [Bosanski / Hrvatski / Srpski](#bosanski--hrvatski--srpski)

An open-source directory of higher-education data for Bosnia and Herzegovina, Serbia, Croatia, and Montenegro: a public REST API, a searchable webapp, and an authenticated contribution workflow with admin moderation.

- Live webapp: <https://atlasuniverziteta.com/>
- Live REST API: <https://api.atlasuniverziteta.com/>
- In-app API docs: <https://atlasuniverziteta.com/api-docs>

![Atlas Univerziteta](./webapp/public/images/og-images/og-image-home.png)

The data is modeled as a nested academic hierarchy: university, its faculties, and their study programs - each program carrying its tracks (smjerovi) as part of its data.

## Features

- Public REST API under `/api/v1` - no authentication required
- Unified search across universities, faculties, and study programs: multi-word queries where every word must match somewhere in the entity's hierarchy, case- and diacritic-insensitive, tolerant of Bosnian/Croatian/Serbian inflected forms, with ECTS/duration/founding-year matching and local-language filter words (e.g. "javna" finds public universities)
- Relevance-ranked, grouped results with per-type filters and counts
- Detail pages for universities and faculties with shareable links and per-page social previews
- Email/password signup with email verification, session login, and optional GitHub/Google OAuth (with automatic account linking)
- Authenticated suggestions for creating, updating, or deleting data, reviewed by admins before applying - the review shows the current data, child counts, and the entity's place in the academic hierarchy
- Whole-university suggestions: one reviewed submission can hold a university with its faculties, study programs, and tracks - built in a nested form or pasted as JSON
- Data provenance built in: every university and faculty links to the official page it was sourced from, and addresses open directly in Google Maps
- Zod validation on both ends, WCAG-checked UI in English and the local language

## Quick start

```bash
git clone https://github.com/goran1010/atlas-univerziteta.git
cd atlas-univerziteta
npm run install:all
cp server/.env.example server/.env && cp webapp/.env.example webapp/.env
npm run db:setup && npm run db:seed
npm run dev:all
```

Requires Node.js 24.x and PostgreSQL. Full instructions, environment variables, and testing: [docs/SETUP.md](./docs/SETUP.md). Hosting layout and share-preview builds: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## API in brief

Base URL: `https://api.atlasuniverziteta.com`

```text
GET /                     service index
GET /api/v1/universities        also /universities/:id
GET /api/v1/faculties           also /faculties/:id
GET /api/v1/study-programs      also /study-programs/:id
GET /api/v1/tracks              also /tracks/:id
GET /api/v1/search?searchTerm=&country=&entity=&ownership=&cycle=&type=
```

Responses return `{ "message", "data" }`; errors return `{ "error": { "code", "message" } }`. List endpoints are paginated - `?page=&limit=` (up to 100 per page) with `page`, `totalPages`, and `total` in the response. Interactive documentation with examples lives at [atlasuniverziteta.com/api-docs](https://atlasuniverziteta.com/api-docs).

## Testing

```bash
npm run test:all   # server + webapp unit/integration + Playwright e2e with axe accessibility scans
```

Details in [docs/SETUP.md](./docs/SETUP.md#testing).

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - code, documentation, bug reports, and data-quality improvements are all welcome. Data suggestions can also be submitted in-app under "Improve data".

## License

GNU Affero General Public License v3.0 - see [LICENSE.md](./LICENSE.md).

Bosnian university data sourced from [Agencija za razvoj visokog obrazovanja i osiguranje kvaliteta BiH (HEA)](https://www.hea.gov.ba/Content/Read/lista-akreditiranih-vsu).

Author: Goran Jović - [@goran1010](https://github.com/goran1010) · [contributors](https://github.com/goran1010/atlas-univerziteta/contributors)

---

## Bosanski / Hrvatski / Srpski

[English](#atlas-univerziteta) | **Bosanski / Hrvatski / Srpski**

Atlas Univerziteta je open-source projekat sa podacima o visokom obrazovanju u Bosni i Hercegovini, Srbiji, Hrvatskoj i Crnoj Gori: javni REST API, web aplikacija sa pretragom i sistem prijedloga izmjena uz administratorsku provjeru.

- Web aplikacija: <https://atlasuniverziteta.com/>
- REST API: <https://api.atlasuniverziteta.com/>
- API dokumentacija: <https://atlasuniverziteta.com/api-docs>

![Atlas Univerziteta - početna stranica](./webapp/public/images/og-images/og-image-home-sr.png)

Podaci prate akademsku hijerarhiju: univerzitet, njegovi fakulteti i njihovi studijski programi - svaki program nosi svoje smjerove kao dio svojih podataka.

### Mogućnosti

- Javni REST API pod `/api/v1` - bez prijave i bez ključeva
- Objedinjena pretraga univerziteta, fakulteta i studijskih programa: više riječi odjednom (svaka riječ se traži kroz cijelu hijerarhiju), neosjetljiva na velika/mala slova i dijakritike, prepoznaje padeže i rodove (medicina/medicine/medicini, javna/javni/javno), kao i ECTS bodove, trajanje i godinu osnivanja
- Rezultati rangirani po relevantnosti i grupisani po tipu, uz filtere i brojače
- Stranice sa detaljima univerziteta i fakulteta, sa linkovima za dijeljenje i ispravnim pregledima na društvenim mrežama
- Registracija uz potvrdu emailom, prijava sesijom i opciona GitHub/Google prijava (sa automatskim povezivanjem naloga)
- Prijavljeni korisnici predlažu dodavanje, izmjenu ili brisanje podataka; administratori pri pregledu vide trenutne podatke, broj podređenih stavki i mjesto u akademskoj hijerarhiji prije primjene
- Prijedlozi cijelog univerziteta: jedna prijava može sadržati univerzitet sa fakultetima, studijskim programima i smjerovima - kroz ugniježdenu formu ili lijepljenjem JSON-a
- Porijeklo podataka: svaki univerzitet i fakultet vodi na zvaničnu stranicu sa koje su podaci preuzeti, a adrese se otvaraju direktno u Google mapama
- Validacija podataka na obje strane, pristupačnost provjerena po WCAG standardu, interfejs na engleskom i našem jeziku

### Pokretanje

Komande su iste kao u [engleskom dijelu](#quick-start) - potrebni su Node.js 24.x i PostgreSQL. Detaljna uputstva se nalaze u [docs/SETUP.md](./docs/SETUP.md) (na engleskom).

### Doprinos projektu

Pogledajte [CONTRIBUTING.md](./docs/CONTRIBUTING.md). Prijedloge podataka možete slati i direktno kroz aplikaciju, pod "Poboljšaj podatke". Podaci o univerzitetima u BiH preuzeti su od [Agencije za razvoj visokog obrazovanja i osiguranje kvaliteta BiH (HEA)](https://www.hea.gov.ba/Content/Read/lista-akreditiranih-vsu).

Licenca: GNU Affero General Public License v3.0 - [LICENSE.md](./LICENSE.md).

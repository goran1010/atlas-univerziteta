### Checks

- [x] This is not a duplicate of an existing issue (please check our [open issues list](https://github.com/goran1010/atlas-univerziteta/issues))
- [x] I have read and understand the [Contributing Guidelines](https://github.com/goran1010/atlas-univerziteta/blob/main/docs/CONTRIBUTING.md)

### Feature description

Structural changes to support adding countries without schema migrations, and data for the remaining Balkan countries: Slovenia, North Macedonia, Albania, and Kosovo. Builds on #407, which tracks the multi-country follow-up for the current four (BIH, SRB, HRV, MNE).

**Schema: country as a string column**

The `country` Prisma enum (`BIH | SRB | HRV | MNE`) requires a schema migration for every new country. Replace it with a `String` column validated against a shared list.

- Add a `COUNTRIES` const array (e.g. in `server/src/countries.ts`) that is the single source of truth for valid country codes. Derive the Zod schemas, seed validation, search aliases, and webapp `countrySchema` from it. This also addresses the "one country list per side" item in #407.
- Migration: `ALTER TABLE university ALTER COLUMN country TYPE TEXT` (Prisma will generate a drop-and-recreate by default - edit the migration SQL to use ALTER). Same for `pending_change.country` if it stores the enum. Existing data is unaffected since `"BIH"` is the same as a string.
- University uniqueness: change `@@unique([name, city])` to `@@unique([name, city, country])` - "Univerzitet u Novom Pazaru" in SRB and a hypothetical one elsewhere should not collide. Update the seed upsert keys and map keys to include country. This also addresses the uniqueness policy item in #407.

**Schema: generalize entity/subdivision**

The `entity` enum (`FBIH | RS | BD`) and all the `country === "BIH"` checks (server validation, server approval, seed, client validation, client UI - 5 locations) are hardcoded to Bosnia. Replace the enum with a `String?` column and a country-to-subdivisions mapping.

- Add a `SUBDIVISIONS: Record<string, string[]>` map (e.g. `{ BIH: ["FBIH", "RS", "BD"] }`) alongside the `COUNTRIES` array. Countries without subdivisions have no entry.
- Change the 5 "entity required iff BIH" checks to use the map: `SUBDIVISIONS[country] !== undefined` means subdivisions are required, otherwise rejected. Currently only BIH has entries, but the logic generalizes if needed.
- Migration: `ALTER TABLE university ALTER COLUMN entity TYPE TEXT`. Same for `pending_change.entity`.

**Data: Slovenia (SVN)**

~41 accredited institutions (9 universities, 32 independent HEIs). Accreditation authority: [NAKVIS](https://nakvis.si/?lang=en) (Slovenian Quality Assurance Agency for Higher Education). Public records of accredited institutions and programs: https://www.nakvis.si/accreditations-and-evaluations/public-records/?lang=en

Public universities: Univerza v Ljubljani, Univerza v Mariboru, Univerza na Primorskem, Univerza v Novem mestu. Private: Nova univerza, Alma Mater Europaea, Univerza v Novi Gorici.

**Data: North Macedonia (MKD)**

~15 accredited institutions. Accreditation authority: [AQHE](https://www.enqa.eu/membership-database/heaeb-higher-education-accreditation-and-evaluation-board/) (Agency for Quality in Higher Education, successor to HEAEB). Reference list: https://www.unirank.org/mk/a-z/

Public universities include: Ss. Cyril and Methodius University (Skopje), Goce Delcev University (Stip), St. Kliment Ohridski University (Bitola). Private: South East European University (Tetovo), FON University, International Balkan University, European University, University American College Skopje.

**Data: Albania (ALB)**

~70 accredited institutions (17 public, 53 private). Accreditation authority: [ASCAL](https://ascal.al/en/lista-e-ial/) (Quality Assurance Agency of Higher Education). Official institution list: https://www.ascal.al/en/hei-list/hei

Public universities include: Universiteti i Tiranes, Universiteti Politeknik i Tiranes, Universiteti i Mjekesise Tirane, Universiteti "Luigj Gurakuqi" (Shkoder), Universiteti "Ismail Qemali" (Vlore), Universiteti "Fan S. Noli" (Korce), Universiteti "Eqrem Cabej" (Gjirokaster), Universiteti "Aleksander Moisiu" (Durres).

**Data: Kosovo (XKX)**

~23 accredited institutions (10 public, 13 private). Accreditation authority: [KAA](https://akreditimi.rks-gov.net/home-2/) (Kosovo Accreditation Agency). Reference list: https://en.wikipedia.org/wiki/List_of_universities_in_Kosovo

Public universities include: Universiteti i Prishtines "Hasan Prishtina", Universiteti i Prizrenit "Ukshin Hoti", Universiteti "Haxhi Zeka" (Peje), Universiteti i Gjakoves "Fehmi Agani", Universiteti i Gjilanit "Kadri Zeka", Universiteti i Mitrovices "Isa Boletini". Private: Universum College, RIT Kosovo (A.U.K), UBT.

**Data sourcing standards**

The new country data must meet the same standard as BiH: `dataSourceUrl` per program linking to the official page it was sourced from, real accreditation dates from the authority, no uniform defaults for ECTS/duration/language. #407 already flags the gap for SRB/HRV/MNE data.

Start with universities and faculties only (names, cities, websites, contact, accreditation, ownership) from the official accreditation agency lists. Study programs can follow once the per-program sourcing workflow is established for each country.

**Search: diacritic folding and stemming**

`fold.ts` only maps 5 BCS diacritics (c-hacek, c-acute, s-hacek, z-hacek, d-stroke). Slovenian uses the same set. Albanian adds c-cedilla (c with cedilla) and e-umlaut (e with diaeresis). North Macedonian and Kosovar data is mostly Cyrillic-transliterated or in Latin script.

The NFD-based folding approach in #407 ("NFD with diacritic stripping plus a small map for exceptions") covers all of these. No additional stemming work is needed beyond what #407 already tracks - BCS inflection stripping is the only stemmer, and it partially helps for Macedonian (also South Slavic). Albanian and Slovenian would benefit from their own suffix lists eventually, but exact-match search works without them.

**Search aliases for new countries**

Add aliases for the 4 new countries in `aliases.ts`: native names (Slovenija, Makedonija/Severna Makedonija, Shqiperia, Kosova/Kosove), English names, and common stems. Note the collision risks from #407: three-letter codes like ALB and MKD are less likely to collide with common words than AND/EST/FIN, but the alias map should use the dedicated country-alias approach #407 describes rather than the general enum alias map.

**Locale labels**

Add country labels in both `en.json` and `sr.json` for the 4 new codes, in both the `contribution.countries` and `universitiesPage.countries` sections (or the single merged section if #407 consolidates them first).

### Component

- [x] Backend / API
- [x] Frontend / UI
- [x] Database / Data

### Priority

High - Critical for project goals

### Additional context

Official accreditation data sources:
- Slovenia: [NAKVIS public records](https://www.nakvis.si/accreditations-and-evaluations/public-records/?lang=en)
- North Macedonia: [AQHE (ENQA profile)](https://www.enqa.eu/membership-database/heaeb-higher-education-accreditation-and-evaluation-board/)
- Albania: [ASCAL institution list](https://www.ascal.al/en/hei-list/hei)
- Kosovo: [KAA](https://akreditimi.rks-gov.net/home-2/), [Wikipedia list](https://en.wikipedia.org/wiki/List_of_universities_in_Kosovo)

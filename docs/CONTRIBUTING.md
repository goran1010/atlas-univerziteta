# Contributing to Atlas Univerziteta

Contributions of any kind are welcome - bug fixes, new features, documentation, or tests. University data is contributed through the app itself, not through pull requests - see [In-App Data Contributions](#in-app-data-contributions). The JSON files in `server/JSON_files/` are the bootstrap dataset for development and e2e databases; the live dataset evolves only through approved in-app suggestions.

## Getting Started

1. Fork the repository and create your branch from `main`
2. Run `npm run install:all` to install dependencies
3. Set up your local environment:
   - Copy `server/.env.example` to `server/.env` and fill in your database, email service, BetterAuth secret, and GitHub/Google OAuth credentials (all required - the server won't start without them)
   - Copy `webapp/.env.example` to `webapp/.env` and update `VITE_API_URL` if needed
4. Set up the databases:
   - Run `npm run db:setup` to initialize the development database
   - Server tests need no database setup - the suite creates its own temporary databases from `TEST_DATABASE_URL` (the user just needs `CREATEDB` rights)
   - E2E tests need no database setup either - the suite creates, resets, and seeds its own `uniatlas_e2e` database; just install the browser once with `npm run install:browsers`
5. Make your changes, write tests where appropriate, and ensure the full test suite passes (`npm run test:all`)
6. Open a pull request referencing any related issues

## Email Confirmation in Development

In development and test modes, the server skips sending real emails and logs the confirmation link to the console instead. You can click it directly to confirm the account - no `RESEND_API_KEY` needed.

In production, emails are sent via [Resend](https://resend.com). The default sender (`onboarding@resend.dev`) is Resend's shared test domain and can only deliver to the Resend account owner's email. To send to any user, verify a custom domain in the Resend dashboard and set `RESEND_FROM_EMAIL` in the server environment.

## Guidelines

- Never commit secrets, API keys, or `.env` files
- All data must come from verifiable and/or official sources
- Keep commits focused; use conventional prefixes: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, etc.
- Write tests for new features or bug fixes
- Run `npm run test:all` locally before pushing to ensure all tests pass
- Follow existing code style and patterns in the codebase

## In-App Data Contributions

Data contributions happen in the Atlas Univerziteta app - suggestions are reviewed by admins and applied to the live dataset there. Use the workflow below:

1. Create an account and confirm your email.
2. Log in and open `/improve-data`.
3. Submit a suggestion to create, edit, or delete a university entity (University, Faculty, Study Program, or Track).
4. Your suggestion is stored as a pending change.
5. Admin users review pending changes and either approve or reject them.

Notes:

- Approved suggestions are applied to the live university dataset by admins.
- Approving a deletion also removes everything nested under the entity (a
  university's faculties, their study programs, and their tracks).
- You can remove your own pending suggestion before review from the pending changes list in the dashboard.

## Contributing a Whole University (JSON)

Besides single-item suggestions, the app accepts a whole university in one submission: the university together with its faculties, their study programs, and their tracks. There are two ways to build one, and both are stored as one pending change and reviewed as one unit: an admin approves everything or declines everything.

- In the "Propose changes" tab, a create suggestion can nest children directly: add faculties to a university, study programs to a faculty, and tracks to a study program with the add buttons under the form.
- In the "Add university or faculty (JSON)" tab, paste or load the same structure as JSON, validate, check the preview, and submit.

You can also start one level lower: pick Faculty as the item type, choose the university it belongs under, and submit a faculty with its study programs and tracks.

The JSON mirrors the structure of the seed files. Children live in `faculties`, `studyPrograms`, and `tracks` arrays, and each level takes the same fields as the single-item form:

- University: `name`, `city`, `country` (`BIH`, `SRB`, `HRV`, `MNE`), and `ownership` (`PUBLIC`, `PRIVATE`) are required; `entity` (`FBIH`, `RS`, `BD`) is required for BIH and rejected for other countries; `acronym`, `foundedYear`, `website`, `address`, `phone`, and `email` are optional.
- Faculty: `name` is required; `city`, `website`, `address`, `phone`, and `email` are optional.
- Study program: `name` and `cycle` (`FIRST`, `SECOND`, `THIRD`, `INTEGRATED`, `VOCATIONAL`, `SPECIALIST`) are required; `durationYears`, `ects`, and `language` are optional.
- Track: `name` is required; `ects` and `durationYears` are optional.

Example:

```json
{
  "name": "Example University",
  "city": "Sarajevo",
  "country": "BIH",
  "entity": "FBIH",
  "ownership": "PRIVATE",
  "faculties": [
    {
      "name": "Faculty of Example Studies",
      "studyPrograms": [
        {
          "name": "Example Program",
          "cycle": "FIRST",
          "durationYears": 3,
          "ects": 180,
          "tracks": [{ "name": "Example Track" }]
        }
      ]
    }
  ]
}
```

Rules the validator enforces:

- Sibling names must be unique: faculty names within a university, study program name and cycle pairs within a faculty, and track names within a study program. These mirror the database constraints, so an approved submission cannot half-fail.
- A submission can hold at most 800 items in total, and the request body at most 512kb.
- Unknown fields are rejected. Seed-only fields (`dataSourceUrl`, `lastModified`, `accreditationFrom`, `accreditationTo`, `authority`, `isUniversityLevel`) are not accepted in contributions.

If an approved submission collides with existing data, for example a university with the same name already exists, nothing is applied, the suggestion stays in the queue, and the admin sees which name collided.

## Reporting Issues

For bugs or feature requests, open a GitHub issue. For security vulnerabilities, email <goran1010jovic@gmail.com> instead of opening a public issue.

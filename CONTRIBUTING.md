# Contributing to UniAtlas Bosnia

Contributions of any kind are welcome - bug fixes, new features, data, documentation, or tests.

## Getting Started

1. Fork the repository and create your branch from `main`
2. Run `npm run install:all` to install dependencies
3. Set up your local environment:
   - Copy `server/.env.example` to `server/.env` and fill in your database, email service, and (optionally) GitHub OAuth credentials
   - Copy `webapp/.env.example` to `webapp/.env` and update `VITE_SERVER_URL` if needed
4. Set up the databases:
   - Run `npm run db:deploy_generate` to initialize the development database
   - Run `npm run db:test:deploy_generate` if you plan to run server tests
5. Make your changes, write tests where appropriate, and ensure the full test suite passes (`npm run test:all`)
6. Open a pull request referencing any related issues

## Guidelines

- Never commit secrets, API keys, or `.env` files
- All data must come from verifiable and/or official sources
- Keep commits focused; use conventional prefixes: `feat:`, `fix:`, `docs:`, `data:`, `test:`, `refactor:`, `chore:`, etc.
- Write tests for new features or bug fixes
- Run `npm run test:all` locally before pushing to ensure all tests pass
- Follow existing code style and patterns in the codebase

## In-App Data Contributions

If you want to contribute data through the UniAtlas Bosnia app (instead of opening a code PR), use the current workflow below:

1. Create an account and confirm your email.
2. Log in and open `/improve-data`.
3. Submit a suggestion to create, edit, or delete a university entity (University, Faculty, Study Program, Track, or Subject).
4. Your suggestion is stored as a pending change.
5. Admin users review pending changes and either approve or reject them.

Notes:

- Approved suggestions are applied to the live university dataset by admins.
- You can remove your own pending suggestion before review from the pending changes list in the dashboard.

## Reporting Issues

For bugs or feature requests, open a GitHub issue. For security vulnerabilities, email <goran1010jovic@gmail.com> instead of opening a public issue.

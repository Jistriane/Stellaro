# Frontend Overview

## Stack

- Next.js
- React
- Tailwind CSS

## Development

1. Work from the monorepo root: `/home/jistriane/Stellaro/Stellaro`
2. Install dependencies with `npm install`
3. Validate the environment with `npm run doctor:local-dev`
4. Start the official local stack with `npm run dev:stack`

For the canonical local workflow, use `docs/LOCAL_DEV_MODES.md`.

## Tests

- Unit and integration tests are provided via the repository test scripts.
- Use the project-local test runner to avoid version mismatches.

## Notes

Keep environment variables and runtime locale settings aligned with the documentation index.

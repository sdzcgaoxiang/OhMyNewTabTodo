# Repository Guidelines

## Project Structure & Module Organization

- `src/`: React UI and ES modules. `model.js` owns operations, `transfer.js` backup compatibility, and `repository.js` persistence. `components/` contains UI components; `background.js` is the single writer, accessed through `client.js`.
- `public/`: Manifest V3 configuration and license notices.
- `tests/*.test.js`: unit tests; `tests/browser/`: extension acceptance tests; `tests/fixtures.js`: synthetic data.
- `docs/`: research, specifications, plans, and verification. `scripts/`: packaging. `.github/workflows/`: CI/releases. Generated `dist/` and `release/` are ignored.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm. Packaging requires `zip` and `unzip`.

- `npm ci`: install locked dependencies.
- `npx playwright install chromium`: install the test browser.
- `npm run dev`: start Vite; development data uses separate localStorage.
- `npm run build`: build the loadable extension into `dist/`.
- `npm test`: run Node's built-in test runner.
- `npm run test:e2e`: test the previously built extension in isolated Chromium profiles.
- `npm run check`: run formatting checks, unit tests, build, and browser tests.
- `npm run package`: rebuild and create the ZIP and SHA-256 checksum.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, semicolons, and Prettier's 100-column width. Run `npm run format`. Use PascalCase components, camelCase functions/variables, and descriptive `*.test.js` filenames. Separate UI from pure operations.

## Testing Guidelines

Follow spec-first TDD: update specifications, run a failing test, then implement. Use Node tests for domain/storage logic and Playwright for workflows. No numeric coverage threshold is configured; cover failure paths, preservation, persistence, and concurrency. Name tests after observable behavior; await persisted state for asynchronous UI assertions.

## Commit & Pull Request Guidelines

Follow existing `feat:`, `test:`, and `docs:` prefixes; use `fix:` for corrections. Write imperative subjects. Follow the PR template: explain the problem, result, related issues, verification, and documentation impact; include synthetic UI screenshots.

## Release Documentation

Follow [the release checklist](docs/releasing.md) for every version. Refresh bilingual README/features, CHANGELOG, version-specific verification, and Release notes. Update privacy, screenshots, specifications, and contributor guidance when affected. Keep language pairs in one PR; preserve historical evidence. Documentation-only changes stay Unreleased without a product version bump.

## Data Safety & Architecture

Preserve unknown imported fields and legacy IDs. Send mutations through the background writer, never stale page snapshots. Never commit `reference/`, `private-backups/`, credentials, browser profiles, or proprietary NewTabTodo code/assets. Cross-device sync remains outside v1. See `CONTRIBUTING.md` for details.

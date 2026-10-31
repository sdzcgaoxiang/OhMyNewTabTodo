# Bilingual UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Default the extension UI to English and provide a persistent `EN / 中文` switch on the new-tab homepage.

**Architecture:** Store the selected language in the existing background-owned `app_state`, treating absent values in old state and backups as English. A typed translation catalog covers UI text, while structured diagnostics cross the background boundary and render in the selected language. Chrome manifest metadata uses `_locales` separately from the in-page preference.

**Tech Stack:** TypeScript, React 19, Chrome Manifest V3 storage, Node test runner, Playwright Chromium, Vite.

**Spec:** `docs/superpowers/specs/2026-10-31-bilingual-ui-design.md`

## Global Constraints

- Default locale is `en`; the other locale is `zh-CN`; no browser-language detection.
- Put `EN / 中文` in the homepage topbar, never solely in Settings.
- Keep unknown imported fields, legacy IDs, user-authored text, background-only writes, and the v1 backup format compatible.
- Do not add runtime dependencies, permissions, network calls, automatic sync, or a release tag.
- Preserve the existing edits to `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Use Node.js 22.12+ and the existing `npm run check` and `npm run package` gates.

## Review Focus

1. Old persisted `app_state` without `language` opens in English without an implicit write (Task 1 repository test).
2. A replacement import of an old full backup keeps the chosen language; a new full backup restores its language (Task 1 transfer tests).
3. A failed language write keeps the previous selection and displays a localized error (Task 3 browser test).
4. English mode never shows Chinese transfer warnings or background errors, including dynamic IDs/counts (Task 2 unit tests and Task 3 browser test).
5. The language control remains visible and keyboard operable at 375 px while search and dialogs work (Task 3 browser test).

---

## File map

- `src/types.ts`, `src/model.ts`, `src/operations.ts`, `src/repository.ts`, `src/transfer.ts`: language state, persistence, backup/import behavior.
- `src/i18n.ts`, `src/i18n.tsx`: typed English/Chinese catalog, parameter formatting, locale-aware date presentation and React context.
- `src/issues.ts`, `src/protocol.ts`, `src/background.ts`, `src/client.ts`: structured errors and warnings across the background boundary.
- `src/App.tsx`, `src/components/{Dialog,Editors,Settings,Transfer}.tsx`, `src/components/ui.ts`, `src/dates.ts`, `src/styles.css`, `index.html`: home switch and translated UI.
- `public/manifest.json`, `public/_locales/{en,zh_CN}/messages.json`, `scripts/package.mjs`: localized extension metadata and package allowlist.
- `tests/{model,repository,transfer,dates,package}.test.ts`, `tests/i18n.test.ts`, `tests/browser/extension.spec.ts`: behavior checks.
- `README.md`, `README.en.md`, `docs/features.md`, `docs/features.en.md`, `CHANGELOG.md`, `docs/images/`, a new verification record: paired release documentation.

### Task 1: Persist language without losing old data

**Interfaces:** Produce `type Language = 'en' | 'zh-CN'`, `AppState.language: Language`, `Snapshot.language?: Language`, `ModelOperation` case `{ type: 'language'; language: Language }`, and `ParsedImport.language?: Language`.

- [ ] **Step 1: Establish isolation and baseline.** Follow `superpowers:using-git-worktrees` at execution time; install locked dependencies, then run `npm test`. Keep the existing CI changes in their original checkout.
- [ ] **Step 2: Update the spec tests first.** In `tests/model.test.ts`, assert a new state is English and a language operation changes only the preference. In `tests/repository.test.ts`, assert a legacy stored state reads as English without `set()`, and two queued language writes use the background writer. In `tests/transfer.test.ts`, assert new full backups contain language, old full backups remain accepted, replacement/new backup restores language, replacement/old backup keeps current language, and legacy export omits language.
- [ ] **Step 3: Run `npm test`; confirm these cases fail because language support is missing.**
- [ ] **Step 4: Implement the interfaces.** Normalize missing persisted language to `en` on read without a write. Add the operation in `applyOperation`, include language in `snapshot`/full export, parse optional language with validation, apply it only for replacement of a new full backup, and preserve current language for other import modes or old backups. Restore points created before this change retain the current language.
- [ ] **Step 5: Run `npm test` and `npm run typecheck`; require zero failures.** Commit only this task's files with `feat: persist interface language`.

### Task 2: Centralize two-language copy and diagnostics

**Interfaces:** Produce `translate(language: Language, key: TranslationKey, values?: Record<string, string | number>): string`, `formatIssue(language: Language, issue: IssuePayload | unknown): string`, and `formatRecoveryLabel(language: Language, label: string): string` in `src/i18n.ts`; produce serializable `{ code: string; values?: Record<string, string | number> }` issue payloads in `src/issues.ts`. Change `ParsedImport.warnings` to `IssuePayload[]`. Extend the error branch of `RuntimeResponse` with an optional issue payload while retaining a safe fallback message. Make `duePresentation(card, now, language)` use the selected language.

- [ ] **Step 1: Write failing `tests/i18n.test.ts` and `tests/dates.test.ts` cases.** Assert English/Chinese static labels and parameterized counts; unknown issues have a safe fallback in the selected language; today/tomorrow/overdue and month/weekday formatting follow `language`. Assert known historical recovery labels translate at display time and unknown labels remain verbatim. Add transfer tests for localized static and dynamic warnings/errors without changing imported user text.
- [ ] **Step 2: Run the focused tests and confirm the expected missing-API or wrong-language failures.**
- [ ] **Step 3: Implement the catalog and typed diagnostic transport.** Replace user-visible business errors and transfer warnings in `model.ts`, `transfer.ts`, `repository.ts`, and `client.ts` with codes plus parameters; send the payload through `background.ts`/`protocol.ts`; render at the UI boundary. Preserve raw unknown user data and avoid string matching on Chinese messages. Keep internal fallback errors safe in English mode.
- [ ] **Step 4: Run `npm test` and `npm run typecheck`; require zero failures.** Commit only this task's files with `feat: localize interface messages`.

### Task 3: Add the homepage switch and translate the complete UI

**Interfaces:** The topbar exposes two buttons named `English` and `简体中文`, with `aria-pressed` reflecting `AppState.language`. `src/i18n.tsx` provides `I18nProvider({ language, children })` and `useT()` for child components; `App` uses `translate` directly before the provider is mounted. The switch dispatches `{ type: 'language', language }` through `act`.

- [ ] **Step 1: Add failing browser coverage.** In `tests/browser/extension.spec.ts`, assert a fresh profile starts in English; `EN / 中文` switches all primary surfaces (home, editors, details, settings, bookmarks, import/restore, confirmations) and persists after reload and across tabs. Test `html lang`, keyboard activation, a failed save, and 375 px visibility. Keep existing Chinese workflow tests by selecting Chinese in their setup, while the fresh-profile test bypasses that setup.
- [ ] **Step 2: Build the old extension and run the new browser tests; confirm expected English/switch failures.**
- [ ] **Step 3: Implement the topbar control and translate every user-facing literal.** Cover `App.tsx`, all components, loading/fatal views, aria labels, placeholders, dynamic counts, dates, save notices and transfer previews. Generate default board/recovery names in the selected language when created; display old built-in recovery labels through `formatRecoveryLabel`. Set document language after state loads and keep in-progress form values during a switch. Style the control for wide and 375 px screens.
- [ ] **Step 4: Run `npm run build` and `npm run test:e2e`; require zero failures.** Review English and Chinese screenshots with synthetic data. Commit only this task's files with `feat: switch homepage language`.

### Task 4: Package metadata and synchronize documentation

**Interfaces:** `manifest.json` uses `default_locale: 'en'` and `__MSG_...__` for description and action title; `_locales/en/messages.json` and `_locales/zh_CN/messages.json` supply those strings. The package allowlist includes exactly these locale files, and the ZIP contains them.

- [ ] **Step 1: Add failing `tests/package.test.ts` assertions for locale metadata and the packaged files.** Run the focused test to confirm it fails on the current Chinese-only manifest/package.
- [ ] **Step 2: Implement manifest catalogs and extend `scripts/package.mjs` allowlist.** Keep the product name and permissions unchanged. Verify Chrome loads both locale directories.
- [ ] **Step 3: Update both README files and both feature pages together.** Describe the default English UI, homepage switch, preference persistence, Chrome-managed manifest language, and unchanged synchronization limits. Add paired Unreleased entries in `CHANGELOG.md`; refresh affected synthetic screenshots and write a bilingual verification record. Do not rewrite historical releases or bump the product version in this task.
- [ ] **Step 4: Run `npm run check` and `npm run package`.** Inspect ZIP contents, SHA-256 file, screenshots, paired facts/links and `git diff --check`; require zero failures. Commit only the feature/docs files with `docs: document bilingual interface`.
- [ ] **Step 5: Open a PR only if requested or otherwise authorized; let CI run on the branch/PR.** Confirm the CI check and package artifact before merge. The release workflow remains tag-triggered and is outside this implementation.

## Self-review

- Spec coverage: default English, homepage control, persistence/import semantics, full UI copy, diagnostics, metadata, accessibility, docs and CI each have an owning task.
- Task boundaries: persistence, translation infrastructure, UI and packaging/docs can be reviewed separately; each has a failing test before implementation.
- No workflow file in the existing checkout is edited by this plan. The version stays at `0.2.0` until the release checklist is run for a future version.

# External File Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task, with failing tests before implementation.

**Goal:** Export a stable, read-only JSON snapshot and provide a CLI and Codex skill for local tools, including when Chrome exits.

**Architecture:** Keep the background repository as the sole task-state writer. An extension page owns an IndexedDB-persisted file handle and uses a Web Lock to serialize configuration changes and snapshots obtained through `readState()`; pages listen for persisted changes and coordinate notifications. File output is a versioned projection, not a backup or input source.

**Tech Stack:** TypeScript, React, Chrome MV3, File System Access API, IndexedDB, Web Locks, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-external-file-interface-design.md`.

## Global Constraints

- Preserve Chrome 120 minimum and existing task storage, imports, legacy IDs, and unknown internal fields.
- Feature defaults off; no bridge, server, network permission, native messaging or downloads permission.
- Provide bilingual UI and Unreleased docs; do not bump a release or publish.
- Chrome extension origin and real user-selected file capability must be probed first; if unavailable, stop and report rather than silently changing architecture.
- All user files are preserved on error, stop and target change; use synthetic files for verification.

## Review Focus

- An imported orphan task or hidden board must remain visible in the external projection (Task 2).
- A failed `close()` must not claim a successful export or change task state (Task 3).
- A delayed picker result or old tab cannot re-enable a stopped connection or overwrite a newer snapshot (Task 3).
- A selected file owned by another instance requires explicit takeover; later foreign ownership pauses export (Task 3).
- Revoked permissions after browser restart must be recoverable by a user gesture; no automatic permission prompt (Tasks 1, 3, 4).

## File structure

- `src/external-snapshot.ts`: pure v1 projection and validation.
- `src/external-file.ts`: file handle persistence, locking, ownership, writes and coordination.
- `src/components/ExternalFile.tsx`: localized controls and status.
- `src/App.tsx`, `src/components/Transfer.tsx`, `src/i18n.ts`: application lifecycle, placement and copy.
- `tests/external-snapshot.test.ts`, `tests/external-file.test.ts`, `tests/browser/extension.spec.ts`: behavior and regression tests.
- `docs/external-file-interface.md`, bilingual README/features, privacy, changelog and verification: user-facing contract and evidence.

### Task 1: Verify actual extension capabilities

**Files:** temporary synthetic probe outside source control; `docs/verification-external-file-interface.md` for actual evidence.

- [ ] Build the existing extension, use an isolated Chromium profile and inspect file pickers, IndexedDB and Web Locks from `chrome-extension://.../index.html`.
- [ ] On a real desktop browser, select a synthetic file, write JSON, restore the handle, and check permission/restart behavior. Record actual results; distinguish unsupported automation from platform failure.
- [ ] Stop if extension-origin file access is demonstrably unavailable. Do not substitute a bridge or downloads.

### Task 2: Define the external snapshot

**Files:** Create `src/external-snapshot.ts`; create `tests/external-snapshot.test.ts`.

**Interfaces:** `createExternalSnapshot(state: AppState, instanceId: string, exportedAt: string): ExternalSnapshot` produces the contract in the approved spec; the projection does not mutate `state`.

- [ ] Add failing tests for legacy fixture IDs, order, hidden/orphan objects, nullable fields, local dates and exclusion of private/unknown fields; include malformed optional data and immutable input.
- [ ] Run `node --import=tsx --test tests/external-snapshot.test.ts`, verify the missing implementation fails.
- [ ] Implement strict projection and deterministic defaults, then rerun the test and `npm test`.

### Task 3: Persist and serialize external file access

**Files:** Create `src/external-file.ts` and `tests/external-file.test.ts`.

**Interfaces:** Export `createExternalFileController(dependencies)` returning `getStatus`, `select`, `reconnect`, `refresh`, `stop`, `subscribe`, and `dispose`. Inject the file, persistence, lock and task-read boundaries for deterministic tests; production adapters use browser APIs.

- [ ] Add failing behavioral tests for successful writes and state, failure/abort, disabled writes, stale picker generations, switching/stop races, changed revision during writing, and explicit foreign ownership takeover.
- [ ] Run the test, verify expected failures; implement an IndexedDB adapter, same-origin Web Lock, saved-handle permission checks, `createWritable`/`close`, status notifications and page lifecycle refresh.
- [ ] Rerun targeted tests and `npm test`; persist source ID and configuration separately from AppState.

### Task 4: Integrate controls and acceptance coverage

**Files:** Create `src/components/ExternalFile.tsx`; modify `src/components/Transfer.tsx`, `src/App.tsx`, `src/i18n.ts`, and `tests/browser/extension.spec.ts`.

**Interfaces:** Render controls from controller status; controller runs while any app page is mounted and listens for successful task persistence; actual picker and permission requests begin from user gestures; use the non-destructive open picker for an existing empty file.

- [ ] Write a failing browser test for the disabled-by-default bilingual controls and for persistence/refresh using the actual extension origin and an isolated file API test adapter; assert errors do not prevent normal task saving.
- [ ] Run the failing test after `npm run build`; integrate status, choose/reconnect/refresh/stop and foreign-file confirmation; rerun browser tests and unit suite.
- [ ] Verify real browser behavior separately from simulated adapter tests; create synthetic UI screenshots.

### Task 5: Document and verify

**Files:** Update bilingual README/features, `PRIVACY.md`, `CHANGELOG.md`; add file contract and language examples, and verification record.

- [ ] Document configuration, local plaintext, last-success semantics, browser/permission limitations, file format, Python and Node examples.
- [ ] Run `npm run check` and report actual results; manually check the real picker, browser restart and permission recovery if the environment permits, noting anything not verified.
- [ ] Review the final diff against the spec and run the relevant fresh checks. Preserve unrelated user files.

### Task 6: Read-only CLI and Codex skill

**Files:** Create a Node CLI, its unit/command tests, and a distributable `skills/omntt/SKILL.md`; update package metadata and bilingual usage docs.

- [ ] Write failing command-level tests using synthetic v1 snapshots for boards, tasks filters, task ID, status, JSON output, file selection precedence, errors and unchanged input file.
- [ ] Implement the Node 22.12+ CLI with `boards`, `tasks`, `task`, `status`, path configuration and `--json` as specified; run targeted tests and `npm test`.
- [ ] Create the concise skill with skill-creator and writing-skills guidance; validate its metadata and exercise it with synthetic snapshots. Document installation without modifying user global configuration.
- [ ] Run `npm run check` and record actual CLI, skill and real extension verification separately. Do not add MCP.

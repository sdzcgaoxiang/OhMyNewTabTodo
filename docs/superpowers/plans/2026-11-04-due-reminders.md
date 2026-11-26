# Due Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Optional due dates that start at today when enabled, with iPhone-style 09:00 all-day reminders and timed system notifications.

**Architecture:** Keep `dueDate` / `dueTime` and the background single writer. Pure local-calendar parsing feeds a serialized reminder service with a separate durable delivery ledger, one next-due alarm and one reconciliation alarm. Reminder preferences travel in existing full-backup options; delivery metadata stays local.

**Tech Stack:** React, TypeScript, Chrome MV3 alarms/notifications/storage, Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-due-reminders-design.md` (approved by user on 2026-11-04).

## Global Constraints

- New cards default to no due date; enabling it uses the local date at the time of the click.
- Date-only reminders default to 09:00, adjustable and switchable independently of timed reminders.
- Preserve schemaVersion 1, legacy IDs, unknown fields and the background single writer.
- No server, no network, no new runtime dependencies; Chrome 120 remains supported.
- No push, tag or release publication. Leave implementation reviewable on `codex/due-reminders`.

## Review Focus

- Invalid imported dates/times must remain intact and never trigger a guessed notification (Task 1).
- DST/timezone changes must recompute local schedules without duplicating a delivered occurrence (Tasks 1–2).
- Notification failures and worker restarts must retain pending reminders without claiming task saves failed (Task 2).
- Startup/import must not send a backlog of historical tasks, while registered missed reminders are caught up (Task 2).
- Clearing/completing/deleting a task in another tab must cancel its pending notification (Tasks 2–3).

### Task 1: Local schedules and compatible preferences

**Files:** `src/dates.ts`, new `src/reminder-settings.ts`, `src/types.ts`, `src/model.ts`, `src/repository.ts`, `src/transfer.ts`; tests `tests/reminder-settings.test.ts`, `tests/dates.test.ts`.

**Interfaces:** `localDateString(now: Date): string`; `reminderTimestamp(card: Card, options: Options): number | null`; `allDayReminderTime(options: Options): string`; `validReminderTime(value: unknown): value is string`. Preferences: `options.allDayReminders` boolean defaults true, `options.allDayReminderTime` optional `HH:mm` defaults `09:00`.

- [x] Write failing tests for date-only 09:00, custom time, disabling only all-day reminders, invalid local dates/times, DST, preference validation, old states and full-backup merge/replace/restore.
- [x] Run `node --import=tsx --test tests/dates.test.ts tests/reminder-settings.test.ts`; observe expected missing behavior.
- [x] Implement signatures above, strict parsing and non-mutating fallbacks; validate optional string separately from existing boolean options.
- [x] Run the targeted tests and `npm run typecheck`; expected zero failures.

### Task 2: Durable background reminder delivery

**Files:** new `src/reminders.ts`, `src/background.ts`, `public/manifest.json`, owned PNG icon; new `tests/reminders.test.ts`.

**Interfaces:** `createReminderService({ repository, area, platform, now? })` produces `sync(): Promise<void>` and `dispatch(operation: RepositoryOperation): Promise<AppState>`. `platform.schedule(next: number | null): Promise<void>` maintains the two named alarms; `platform.show(id: string, card: Card, state: AppState): Promise<void>` displays native notifications with deterministic IDs. Ledger uses its own storage key and retains per-card occurrence history plus pending state; it is never a snapshot field.

- [x] Write failing tests using memory storage and a fake clock/platform: no early delivery, all-day delivery, one delivery across concurrent events/restart, changed schedule, renamed/moved task, cancellation, orphan cards, old backlog, missed registered reminders, denied/failed notification retry, successful save despite scheduler failure and no task revision changes during delivery.
- [x] Run `node --import=tsx --test tests/reminders.test.ts`; observe missing service failure.
- [x] Implement the serialized service and background event wiring. Revalidate before delivery, persist plans before side effects, avoid retaining pending canceled occurrences, use deterministic notification IDs to reduce crash-window duplicates. Initialize/rebuild alarms on startup and worker activation. Native notification click opens the extension.
- [x] Run targeted service tests plus `npm run build`; expected zero failures.

### Task 3: Date activation and reminder settings UI

**Files:** `src/components/Editors.tsx`, `src/components/Settings.tsx`, `src/i18n.ts`, `src/styles.css`, `tests/browser/extension.spec.ts`.

**Interfaces:** Existing form submits `dueDate`/`dueTime`; settings use `options.patch`. New control “设置截止日期” fills today only on click; “移除截止日期” clears both fields. A Reminders section exposes all-day enable/time, notification status, and browser/runtime limits in both languages.

- [x] Write failing extension tests for default empty date, click-time today across midnight, editing old undated cards, clear both fields, persistence, custom all-day preference cross-tab, native alarm scheduling/cancel and background delivery with pages closed.
- [x] Build the baseline and run the focused Playwright tests; observe expected missing controls/alarms.
- [x] Implement controls and localized copy, retain native date/time inputs when enabled, show only-extension notice in dev preview and actual notification permission status in the extension.
- [x] Run focused browser tests and take synthetic screenshots in both languages; inspect layout and keyboard accessibility.

### Task 4: Documentation, review and final verification

**Files:** paired README/features, CHANGELOG, PRIVACY, new `docs/verification-due-reminders.md`, synthetic screenshots, spec/plan status.

- [x] Describe implemented behavior under Unreleased, current released version remains 0.4.0; document permissions, notification title visibility and browser/OS limits accurately.
- [x] Run `npm run check` and `npm run package:dist`; record real results and limitations.
- [x] Use one fresh reviewer for the whole change (required by executing-plans/requesting-code-review), resolve material findings with failing regression tests, then run appropriate checks again.
- [x] Leave the feature branch and changes reviewable in the attached worktree; do not publish or merge.

## Execution record

User “继续” authorizes implementation without another handoff gate. Execute inline, with one independent final review. No automatic commits are needed to make this reviewable; retain the diff for the user. The separate original checkout's design draft is preserved.

## 发布跟进 / Publication follow-up

2026-11-04 用户要求正式发布，授权本功能以 v0.5.0 通过 PR、合并、tag 和既有 Actions 流程发布。此前“不发布”的约束仅适用于实现阶段；发布证据记录在 `docs/verification-v0.5.0.md`。/ On 2026-11-04 the user requested publication as v0.5.0 through PR, merge, tag, and the existing Actions workflow. The earlier no-publication constraint applied to the implementation phase; publication evidence is recorded in `docs/verification-v0.5.0.md`.

# Original Drag Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce NewTabTodo 0.2.0 card and board drag feedback, placement, and persistence.

**Architecture:** Use `@hello-pangea/dnd` for draggable cards and boards, placeholders, and displacement. Keep the existing background writer as the only persistence path; translate a completed drag into one existing move operation.

**Tech Stack:** React 19, TypeScript, `@hello-pangea/dnd`, Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-original-drag-design.md`

## Global Constraints

- Reproduce only original 0.2.0 behavior; do not add a custom overlay or new drag actions.
- Preserve unknown card and board fields and the background writer architecture.
- Keep original package code and assets outside this repository.
- Keep current button movement alternatives and card controls usable.

## Review Focus

- Drag from a board containing hidden completed cards: target index must map into complete `cardIds` without moving into hidden items.
- Drag when hidden boards precede the visible destination: target index must map into complete `boardOrder`.
- Drop outside a valid target or onto the same position: no write or revision change.
- Cross-board drop into an empty board: one card reference in the destination, none in the source.
- Background write failure or another tab's update during drag: visible order must return to persisted state, without duplicate cards.

---

### Task 1: Drag position mapping

**Files:**
- Create: `src/drag-position.ts`
- Create: `tests/drag-position.test.ts`

**Interfaces:**
- Produce: `cardDropIndex(cardIds: string[], visibleCardIds: string[], draggedId: string, visibleIndex: number): number`.
- Produce: `boardDropIndex(boardOrder: string[], visibleBoardIds: string[], draggedId: string, visibleIndex: number): number`.
- Both return the insertion index after removing `draggedId`; clamp out-of-range destination indexes.

- [ ] Write Node tests for same-board upward/downward moves, cross-board empty target, hidden completed cards, and hidden boards.
- [ ] Run `npm test`; confirm the new tests fail because the functions are missing.
- [ ] Implement `src/drag-position.ts` with visible-order to complete-order mapping.
- [ ] Run `npm test`; confirm the new tests pass.
- [ ] Commit as `test: cover drag destination mapping` with implementation.

### Task 2: Original drag structure and persistence

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `src/App.tsx`
- Modify: `tests/browser/extension.spec.ts`

**Interfaces:**
- Consume `cardDropIndex` and `boardDropIndex` from Task 1.
- Consume existing `perform(operation: RepositoryOperation): Promise<boolean>` and `board.move` / `card.move` operations.

- [ ] Replace the existing native-drag browser test with a failing test for card reordering, cross-board movement, board reordering, empty board target, and cancel outside a target; assert persisted order after reload.
- [ ] Run `npm run build && npm run test:e2e`; confirm the new drag assertions fail.
- [ ] Install `@hello-pangea/dnd`, replace native drag handlers with one `DragDropContext`, horizontal board `Droppable`, board `Draggable` with header handle, and vertical card `Droppable` / `Draggable` nodes and placeholders.
- [ ] In `onDragEnd`, ignore missing or unchanged destinations, map visible indexes, and submit exactly one move through `perform`; never persist drag previews.
- [ ] Run `npm run typecheck && npm run build && npm run test:e2e`; confirm passing.
- [ ] Commit as `feat: restore original card and board drag behavior`.

### Task 3: Original visual feedback and edge cases

**Files:**
- Modify: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: `tests/browser/extension.spec.ts`

**Interfaces:**
- Consume Task 2's draggable nodes and drag state snapshots.

- [ ] Add failing browser assertions for placeholder space and displaced neighbors during drag, highlighted card list, disabled drag of hidden completed cards, drag near scroll boundaries, and button controls after drag.
- [ ] Run `npm run build && npm run test:e2e`; confirm the new assertions fail.
- [ ] Apply drag state classes and CSS for original highlighted list and dragged shadow; preserve sortable transforms supplied by the library and resolve card/list overflow if necessary.
- [ ] Run `npm run check` and manually inspect a synthetic board drag in isolated Chromium.
- [ ] Commit as `feat: match original drag preview feedback`.

### Task 4: Documentation and final verification

**Files:**
- Modify: `docs/features.md`, `docs/features.en.md`
- Create: `docs/verification-original-drag.md`

**Interfaces:** No product API changes.

- [ ] Document the migrated original interactions and verification evidence, including original-package evidence boundary.
- [ ] Run `npm run check` and `git diff --check`; record actual results.
- [ ] Commit as `docs: verify original drag migration`.

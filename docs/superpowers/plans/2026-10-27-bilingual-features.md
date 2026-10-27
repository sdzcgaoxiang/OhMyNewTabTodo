# Bilingual Feature Documentation Implementation Plan

> **For agentic workers:** This is documentation-only work following the user-approved outline. Execute inline; validate claims, language parity and links rather than adding behavior tests.

**Goal:** Help NewTabTodo users evaluate and migrate to OhMyNewTabTodo, with a repeatable bilingual release-documentation checklist.
**Architecture:** Paired README and feature pages link to one bilingual release checklist and existing historical evidence.
**Tech Stack:** Markdown; Playwright only for a synthetic screenshot.
**Spec:** docs/superpowers/specs/2026-10-27-bilingual-features-design.md

## Constraints and Review Focus

- Compare audited NewTabTodo 0.2.0 with released OhMyNewTabTodo 0.1.0; no unverified maintenance or market claims.
- State missing automatic sync, Chinese UI, manual installation and capacity/recovery limits in both languages.
- Use synthetic screenshot data; preserve historical audit and verification records.
- Documentation changes do not imply a new product version or release.

## Tasks

- [x] Write paired feature pages and README entry points, checking each benefit against audit evidence and implementation.
- [x] Add a synthetic import-preview screenshot and inspect it.
- [x] Add the bilingual release checklist, contribution/agent rules, PR checklist and bilingual documentation changelog entry.
- [x] Verify language parity, local links/images, commands, version labels and diff hygiene; commit and synchronize documentation to GitHub.

## Validation

- Checked 59 relative links/images/anchors across 11 changed Markdown files, with no missing targets.
- Both README language versions have seven main sections; both feature pages have seven. Versions, input/storage limits, UI language, sync limitations, recovery boundaries and migration-mode semantics were compared.
- `npm run format:check` and `git diff --check` passed. AGENTS remains concise at 380 words.
- Inspected the synthetic import-preview screenshot captured in an isolated temporary Chromium profile. No private export or daily Chrome profile was used.
- Product source, dependencies, manifest and packaging code are unchanged. No new behavioral tests or product release are needed for this documentation-only change.

# Why switch from NewTabTodo?

[简体中文](features.md) · [Installation and migration](../README.en.md) · [Download v0.1.0](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/releases/tag/v0.1.0)

Applies to **OhMyNewTabTodo 0.1.0**, compared with the audited **NewTabTodo 0.2.0**. Reviewed on 2026-10-27.

OhMyNewTabTodo keeps the familiar horizontal board workflow while improving migration, backups, recovery, and protection against conflicting edits across tabs. It is an independent MIT-licensed alternative, unaffiliated with the original author—not an official update or a fork of the original source.

**Who it suits:** NewTabTodo users who want a familiar local workflow with more dependable data transfer and maintainable source code. **If you depend on automatic Chrome cross-device synchronization, this version is not a complete replacement.** The extension UI is currently Chinese; bilingual documentation does not imply an English UI.

## Familiar features retained

- Horizontal boards, ordering, hiding and showing; card dragging, copying, editing, completion, and deletion.
- Descriptions, links, priorities, two label inputs, dates and times, and today / tomorrow / overdue indicators.
- Light and dark themes, compact cards, hidden completed items, quick links, search entry points, and a date/time clock.

These are retained workflows, not advertised as new upgrades. The interface is independently designed rather than a pixel-identical reproduction.

The unreleased development build restores the original drag placeholder, displacement, destination-list highlight, and dragged-card shadow. The published v0.1.0 package still moves items only after dropping.

![Familiar boards using synthetic sample content](images/board.png)

## Improvements available now

| Situation | Audited NewTabTodo 0.2.0 behavior | OhMyNewTabTodo 0.1.0 improvement |
| --- | --- | --- |
| An exported file cannot be imported again | Export may omit `bookmarks`, while import requires an array and reports corruption | Accepts missing bookmarks; previews counts, warnings, and recovery choices before confirmation |
| Boards exist in a file but are absent from the interface | Export includes leftover objects outside the display order, which the original importer mishandles | Preserves these boards and unassigned cards, with explicit recovery choices instead of guessing they should be deleted |
| Imported content is shortened or missing | The original bookmark importer keeps at most 15 entries and truncates names | Does not inherit those truncation rules; preserves long titles, bookmarks, and unknown business fields, subject to overall capacity limits |
| Importing the same backup repeatedly | Recreates task IDs on each import, potentially adding repeated copies | Merge skips identical objects with the same IDs and reports conflicting content; explicit copy mode is available |
| Restoring preferences | Original exports omit complete settings and theme and select business fields through a whitelist | Full backups include tasks, links, settings, theme, and unknown business fields; legacy-format export remains available |
| Replacing or clearing data by mistake | The original data path lacks this version's import preview and recovery-point mechanism | Replacement requires confirmation; retains the latest three recovery points from before imports, restores, or clearing |
| Working in multiple new tabs | Pages keep stale snapshots that can overwrite changes from another page | Pages receive updates; edits check content and board ownership, retaining drafts on conflict; stale import previews cannot commit |
| Failed saves or deleted objects returning | Write errors may be ignored, and deleted objects may remain as old storage keys | Reports success only after saving, surfaces failures, and persists deletion in the stored state |

Same-ID skipping applies to objects carrying IDs in standard legacy exports. Conflicting content is never silently overwritten. Ordinary edits also preserve additional labels and unknown business fields.

## Open source and privacy

Source, build instructions, tests, and version history are public under the [MIT license](../LICENSE), so you can inspect and maintain the project yourself. The extension has no telemetry, accounts, or background upload service. It does not reuse the analytics/feedback endpoints identified in the original audit; that audit does not establish what the original server actually received.

Tasks and backup files are processed locally. Searches and links you actively open still contact the selected websites. See the [privacy policy (Chinese)](../PRIVACY.md).

## Three migration scenarios

**The old extension reports “file corrupted.”** Open Settings → Import / Export (`设置 → 导入 / 导出`) and select the original file. Missing `bookmarks` produces a compatibility notice; other invalid structures are still rejected. This is not a promise to recover every corrupt file.

**You want boards that are missing from view.** Check counts and names in the preview, then choose to recover boards absent from the display order. Unassigned cards can be placed in a recovery board. Leaving these choices unchecked still preserves the data; existing hidden flags remain unchanged.

**You want another file to replace current data.** Select Replace (`替换`) and confirm. A recovery point is saved before committing; use Local Recovery Points (`本机恢复点`) if needed. Replacing from a full backup also restores settings and theme; merge and copy modes retain local preferences.

![Synthetic import preview showing missing bookmarks and a board absent from display order](images/import-preview.png)

## Migration steps

1. Export JSON from the original extension and keep both the file and the old installation.
2. [Download and install this extension](../README.en.md#installation-and-updates), select the JSON in Settings, and review counts and warnings.
3. Use the default Merge mode for an initial migration; choose whether to recover undisplayed objects, then confirm.
4. Check boards, cards, labels, and links, then export a full backup. Decide whether to disable the old extension after verifying the migration.

## Current tradeoffs

- **No automatic cross-device sync.** Transfer full backups manually between computers. Updates between tabs in one browser are not cross-device synchronization.
- **Manual installation and updates.** There is no Chrome Web Store listing. Keep the installation directory, back up first, and reload instead of uninstalling before an update.
- **5 MiB input-file limit and a default 10 MB local quota.** Recovery points share that space, so a file below the input limit can still exceed storage capacity.
- Recovery points cover imports, restores, and clearing that change data. **They are not an undo history for ordinary edits or deletions**, nor a substitute for external backups. Full backups do not recursively include recovery points.
- Fields already lost by the old exporter cannot be reconstructed; not every historical format is verified. Legacy-format export cannot fix bugs in the original importer.

## Evidence and maintenance

Original behavior is documented in the [compatibility research](research/newtabtodo-compatibility.md) and [feature audit](research/newtabtodo-audit.md). New behavior is supported by the [0.1.0 verification record](verification-v0.1.0.md), [transfer tests](../tests/transfer.test.js), [persistence tests](../tests/repository.test.js), and [browser acceptance tests](../tests/browser/extension.spec.js). Research and verification narratives are currently Chinese; this evidence is not an absolute guarantee for every environment.

Review both language versions with the [release documentation checklist](releasing.md#english-release-checklist) for every release. Planned features must not appear under improvements available now.

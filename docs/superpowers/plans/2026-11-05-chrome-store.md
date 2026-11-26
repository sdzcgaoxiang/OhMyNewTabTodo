# Chrome Store materials implementation plan

Goal: prepare store materials and bundled icons for the next release; use its verified GitHub Release ZIP for both distribution channels.

1. Extend the packaging test to require the declared PNG icons and reject unexpected files; confirm failure, then update manifest and allowlist.
2. Create icon assets, correctly sized store screenshots and a promotional tile; check image dimensions and appearance.
3. Update the current privacy scope and prepare bilingual listing and dashboard instructions, clearly identifying account-specific fields and preserving the existing GitHub release.
4. Run the full project checks, package the tested build, inspect the archive and checksum, and record actual verification results without representing a store publication as complete; use the GitHub Release ZIP for store submission after the next version is released.

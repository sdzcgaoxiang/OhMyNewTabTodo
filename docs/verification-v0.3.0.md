# v0.3.0 发布验收 / Release verification

日期 / Date: 2026-10-31

## 范围 / Scope

发布已合并的双语首页：首页右上角切换 `EN / 中文`，首次使用默认英文。版本号、双语说明、安装包和 GitHub Release 使用 `v0.3.0`。`main` 需要 PR 与最新 `check` 通过，禁止强推与删除。发布作业应消费验证作业上传的同一 ZIP。

The already merged bilingual homepage is released with English as the first-use default and an `EN / 中文` switch. Version strings, bilingual documentation, archive, and GitHub Release use `v0.3.0`. The `main` ruleset requires a PR and current `check`, and blocks force pushes and deletion. The publish job consumes the archive uploaded by the verification job.

## 核对项 / Checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| Local `npm run check` | Passed: formatting, 46 unit tests, TypeScript/build, and 32 Chromium browser tests / 通过：格式、46 条单元测试、类型检查与构建、32 条浏览器测试。 |
| Local `npm run package:dist` after check | Passed: packaged 9 files into `OhMyNewTabTodo-0.3.0.zip` / 通过：打包 9 个文件。 |
| `dist/` unchanged by packaging | Passed: SHA-256 hashes of every `dist/` file matched before and after / 通过：打包前后全部 `dist/` 文件的 SHA-256 相同。 |
| ZIP listing and SHA-256 | Passed: 9 allowlisted files including both locale catalogs, manifest, and license; `shasum -a 256 -c SHA256SUMS.txt` reported OK / 通过：9 个白名单文件，包含两种语言目录、manifest 和许可；校验和通过。 |
| PR `check` | Pending / 待执行 |
| Release workflow and downloaded asset | Pending / 待执行 |

Local ZIP SHA-256 / 本地 ZIP 校验值：`4d5a8bfe5840a93b55d78001103b937f0968bbfd9f1ae338b52fbe27b53409e4`。GitHub Actions 将重新生成产物，因此发布资产的校验值需要另行核对。/ GitHub Actions will generate its own artifact, whose checksum must be checked separately.

## Compatibility / 兼容

The [bilingual UI development verification](verification-bilingual-ui.md) covers language persistence, backup behavior, cross-tab updates, keyboard switching, and notices. The current release must rerun the complete suite. / [双语界面开发验收](verification-bilingual-ui.md)已覆盖语言持久化、备份、跨标签页更新、键盘切换和提示；本次发布仍需重新运行完整检查。

## Limits / 边界

Playwright uses its bundled Chromium. This does not claim verification on every supported Chrome version or a Chrome Web Store listing. / Playwright 使用随附 Chromium；不代表逐版验证所有受支持 Chrome，也不代表已经上架 Chrome Web Store。

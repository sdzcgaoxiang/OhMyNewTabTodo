# 双语界面验收 / Bilingual UI verification

日期 / Date: 2026-10-31

状态 / Status: Unreleased source change; the published `v0.2.0` archive remains Chinese-only.

分支 / Branch: `codex/bilingual-ui`

## 结果 / Result

- 首次打开默认为英文；首页右上角 `EN / 中文` 可键盘操作。语言选择持久保存，并同步到其他已打开的新标签页。/ First use defaults to English. The homepage switch is keyboard-operable, persists, and updates other open tabs.
- 编辑、设置、导入导出、日期与错误提示随选择切换；正在编辑的草稿不会因另一标签页切换语言而丢失。/ Editors, settings, transfers, dates, and errors follow the selected language; a language change in another tab preserves an open draft.
- 完整备份包含语言选择；旧格式、合并与副本导入保留本机选择，完整备份替换恢复文件中的选择。/ Full backups include language; legacy, merge, and copy imports keep the local choice, while full replacement restores the file's choice.
- 扩展说明与工具栏标题使用 Chrome 的语言，与首页选择独立。/ Manifest description and toolbar title follow Chrome's language independently of the homepage choice.

## 本地验证 / Local verification

| 检查 / Check | 结果 / Result |
| --- | --- |
| `npm run check` | 格式、46 条单元测试、类型检查与构建、30 条 Chromium 浏览器验收全部通过 / Format, 46 unit tests, typecheck/build, and 30 Chromium acceptance tests passed. |
| `npm run package` | 成功生成 `release/OhMyNewTabTodo-0.2.0.zip` 和 `SHA256SUMS.txt` / Archive and checksum generated. |
| ZIP 清单 / Archive listing | 9 个文件，包含 `_locales/en/messages.json` 与 `_locales/zh_CN/messages.json`；无额外文件 / Nine files including both locale catalogs, with no extra files. |
| `shasum -a 256 -c SHA256SUMS.txt`（在 `release/` 执行 / from `release/`） | `OhMyNewTabTodo-0.2.0.zip: OK` |
| `git diff --check` | 通过 / Passed |

本地 ZIP 的 SHA-256 / Local archive SHA-256: `55111c86ca8b75948515942ca01783a9e676ee4188eb380db21b5e20ae4c0830`. This is a development artifact, not the published v0.2.0 download.

截图使用合成数据 / Screenshots use synthetic data: [English](images/board-en.png) · [中文](images/board-zh.png). Browser coverage includes desktop and phone widths, keyboard switching, persistence, cross-tab updates, and failed writes. / 浏览器验收覆盖桌面和手机宽度、键盘切换、持久化、跨标签页更新及写入失败。

## 边界与后续 / Limits and follow-up

Playwright uses its bundled Chromium; this record does not claim testing on every supported Chrome version or publication to Chrome Web Store. / Playwright 使用随附 Chromium；本记录不代表已在所有受支持 Chrome 版本或 Web Store 验证。

GitHub CI and its package artifact are checked on the pull request before merge. A future release must run the [release checklist](releasing.md), assign its version/tag, and verify the published download. / 合并前核对 PR 的 GitHub CI 与安装包产物；正式发布仍需按[发布清单](releasing.md)确定版本和 tag，并核验下载文件。

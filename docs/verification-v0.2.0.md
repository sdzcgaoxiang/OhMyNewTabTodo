# v0.2.0 验收与发布记录 / Verification and release record

日期 / Date: 2026-10-28。发布分支 / Release branch: `codex/original-drag`，见 [PR #1](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/pull/1)。

## 结果摘要 / Outcome summary

本版恢复原版卡片和看板拖动中的占位、相邻项让位、目标列高亮和卡片阴影。松手后立即显示新顺序，由后台写入器单次保存；保存失败恢复已持久化顺序并提示错误。数据格式、权限和本地存储架构不变，已有 v0.1.0 数据可直接读取。

This release restores the original card and board drag placeholders, displacement, destination highlighting, and dragged-card shadow. The new order appears immediately on drop and is saved once by the background writer; a failed save restores the persisted order and shows an error. The data format, permissions, and local storage architecture remain unchanged, and existing v0.1.0 data can be read directly.

## 本地验证 / Local verification

- `npm run check`：格式检查、35 项 Node 测试、生产构建、25 项隔离 Chromium 浏览器测试通过。测试覆盖拖动预览、跨列移动、键盘排序、隐藏项索引、横向滚动、无效目标取消、延迟写入、保存失败以及旧版数据读取。/ Formatting, 35 Node tests, production build, and 25 isolated Chromium tests passed, including drag preview, cross-board moves, keyboard ordering, hidden-item indexing, overflow, cancellation, delayed writes, failed saves, and legacy-state loading.
- `npm run package`：生成 `OhMyNewTabTodo-0.2.0.zip` 和 `SHA256SUMS.txt`；解压清单仅有 7 个白名单扩展文件，包括许可证，包内 manifest 版本为 0.2.0。/ Generated the archive and checksum; the archive contains seven allowlisted extension files including the license, with manifest version 0.2.0.
- 本地 ZIP SHA-256 / Local archive SHA-256: `507317a9c2d349b138e57c35cb015493e647eb5b988e570629fd09c6a56f04a5`。`shasum -a 256` 与 `SHA256SUMS.txt` 一致。/ The file hash matches the checksum record.
- `git diff --check` 通过。/ Passed.

## 审查与边界 / Review and limits

- 原版交互证据、拖动测试与合成截图见[拖拽迁移验证](verification-original-drag.md)；原版 Chrome 包未能逐像素对照。/ See the [drag migration evidence](verification-original-drag.md) and synthetic screenshot; a pixel-by-pixel comparison against the original Chrome package was unavailable.
- 拖拽未改变备份格式、权限、网络行为或删除语义。`@hello-pangea/dnd` 为 Apache-2.0 拖拽运行时依赖；发布包的 `LICENSE.txt` 包含其完整许可文本及新增依赖的署名。/ Dragging does not change backup format, permissions, network behavior, or deletion semantics. The Apache-2.0 drag dependency's full license and new dependency attributions are bundled in `LICENSE.txt`.
- 仍需手动安装更新；不支持跨设备同步，界面仍为中文。自动化仅在 Playwright 随附 Chromium 上运行。/ Manual installation and updates, no cross-device sync, Chinese UI, and testing limited to Playwright Chromium remain the main limits.
- 本次没有使用真实导出或浏览器配置作为测试样本，也未提交原版闭源代码或素材。/ No real exports, browser profiles, or proprietary original code and assets were included.

## 远程发布 / Remote publication

[PR #1](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/pull/1) 已合并；两个 [CI 检查](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/actions/runs/40635864791)和[对应 PR 检查](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/actions/runs/40635868847)均通过。`v0.2.0` tag 指向合并提交 `9c4123dcdf78231e0f500ba2993d3a81f87587c0`，[发布工作流](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/actions/runs/40636146072)通过。/ PR #1 was merged, both CI checks and the tag release workflow passed, and the tag points to the merge commit.

[v0.2.0 Release](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/releases/tag/v0.2.0) 已发布，附 `OhMyNewTabTodo-0.2.0.zip` 与 `SHA256SUMS.txt`；自动生成的完整 CHANGELOG 已整理为本版中英文发布说明。下载两个附件后执行 `shasum -a 256 -c SHA256SUMS.txt`，ZIP 校验通过，`unzip -t` 无错误，包内 manifest 版本为 0.2.0。GitHub 附件的 ZIP SHA-256 为 `2ea42b9b45dcacbe87e3ab245a279549903fae7874ab6942afc3e9faaa6139e0`，与下载的校验文件及 GitHub 资产摘要一致；校验文件 SHA-256 为 `cfa92cc8835b065e195c11c624198dcd001108c86b0767f77425d61bb897d2f7`。/ The release contains the archive and checksum file, curated bilingual notes, and verified downloaded assets. The published archive hash differs from the independently built local archive hash recorded above; use the published `SHA256SUMS.txt` to verify the downloaded package.

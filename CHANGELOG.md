# Changelog

## Unreleased / 未发布

### Documentation / 文档

- 补录 v0.3.0 发布工作流、下载附件及 SHA-256 的实际验收结果。
- Recorded the actual v0.3.0 release workflow, downloaded asset, and SHA-256 verification results.

## 0.3.0 — 2026-10-31

### Added / 新增

- 首页增加 `EN / 中文` 切换，首次使用默认英文；选择保存在本机并在已打开的新标签页同步，完整备份包含该选择。
- Added an `EN / 中文` homepage switch with English as the first-use default. The choice persists locally, updates open new tabs, and is included in full backups.
- 界面、导入导出提示、日期和错误反馈提供中英文；扩展说明与工具栏标题随 Chrome 语言显示。
- Localized interface copy, import/export notices, dates, and errors; extension description and toolbar title follow Chrome's language.

### Changed / 变更

- 发布工作流只构建并验收一次，发布作业复用经校验的同一安装包。
- The release workflow builds and verifies once, then publishes the same checksum-verified archive.

### Limits / 限制

- 仍需手动安装和更新；不提供 Chrome 跨设备自动同步，也未上架 Chrome Web Store。
- Installation and updates remain manual; there is no automatic Chrome cross-device sync or Chrome Web Store listing.

## 0.2.0 — 2026-10-28

### Added / 新增

- 卡片与看板拖动时显示原版样式的占位、相邻项让位、目标列高亮和拖动阴影；松手后立即显示新顺序，后台保存失败则恢复原顺序并提示错误。
- Card and board dragging now shows original-style placeholders, displaced neighbors, destination highlighting, and dragged-card shadow. The new order appears immediately on drop; a failed save restores the persisted order and shows an error.

### Changed / 变更

- 将业务源码、测试及开发配置迁移到严格检查的 TypeScript；保留数据格式和后台单写架构。
- Migrated application source, tests, and development configuration to strictly checked TypeScript while preserving the data format and single background writer.

### Documentation / 文档

- 新增 TypeScript 迁移计划与验收记录，说明类型边界、兼容性保护和实际验证。
- Added the TypeScript migration plan and verification record, covering typed boundaries, compatibility safeguards, and executed checks.
- 新增中英文升级特性说明和英文 README，明确与已审计 NewTabTodo 0.2.0 的差异、迁移场景及当前限制。
- Added Chinese/English feature comparisons and an English README, explaining differences from audited NewTabTodo 0.2.0, migration scenarios, and current tradeoffs.
- 新增双语版本文档更新清单，并在贡献指南、AGENTS 与 PR 模板中要求同步检查。
- Added a bilingual release-documentation checklist, linked from contributor/agent guidance and the PR template.

### Limits / 限制

- 仍需手动安装和更新；无跨设备自动同步，界面仍为中文。原版 Chrome 安装包无法在本次迁移中进行逐像素对照。
- Installation and updates remain manual; there is no cross-device sync and the UI remains Chinese. A pixel-by-pixel comparison with the original Chrome package was unavailable for this migration.

## 0.1.0 — 2026-10-27

首个本地版本，独立实现 NewTabTodo 风格的新标签页看板。

- 看板和卡片管理、拖拽及按钮移动、主题、常用链接、搜索和时钟设置。
- 兼容 NewTabTodo 0.2.0 导出；兼容缺失 bookmarks，保留未知字段及未列入顺序的看板，不截断书签和标题。
- 导入预览、合并/替换/副本模式、完整备份和旧格式导出、本机恢复点。
- 后台串行写入 `chrome.storage.local`，多页面刷新、编辑冲突及保存失败提示。
- 合成样例单元测试、独立 Chromium 扩展验收、CI 与校验和安装包。

不包含跨设备自动同步、账号、统计上传或 Chrome Web Store 发布。

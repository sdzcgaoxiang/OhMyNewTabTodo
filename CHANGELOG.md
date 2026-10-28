# Changelog

## Unreleased / 未发布

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

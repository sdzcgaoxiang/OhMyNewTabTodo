# Changelog

## Unreleased / 未发布

### Documentation / 文档

- 新增中英文升级特性说明和英文 README，明确与已审计 NewTabTodo 0.2.0 的差异、迁移场景及当前限制。
- Added Chinese/English feature comparisons and an English README, explaining differences from audited NewTabTodo 0.2.0, migration scenarios, and current tradeoffs.
- 新增双语版本文档更新清单，并在贡献指南、AGENTS 与 PR 模板中要求同步检查；本次仅更新文档，未新增产品能力或发布新安装包。
- Added a bilingual release-documentation checklist, linked from contributor/agent guidance and the PR template. This changes documentation only; it adds no product features or new release archive.

## 0.1.0 — 2026-10-27

首个本地版本，独立实现 NewTabTodo 风格的新标签页看板。

- 看板和卡片管理、拖拽及按钮移动、主题、常用链接、搜索和时钟设置。
- 兼容 NewTabTodo 0.2.0 导出；兼容缺失 bookmarks，保留未知字段及未列入顺序的看板，不截断书签和标题。
- 导入预览、合并/替换/副本模式、完整备份和旧格式导出、本机恢复点。
- 后台串行写入 `chrome.storage.local`，多页面刷新、编辑冲突及保存失败提示。
- 合成样例单元测试、独立 Chromium 扩展验收、CI 与校验和安装包。

不包含跨设备自动同步、账号、统计上传或 Chrome Web Store 发布。

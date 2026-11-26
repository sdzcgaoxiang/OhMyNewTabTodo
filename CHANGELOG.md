# Changelog

## Unreleased — 未发布

### Changed / 变更

- 记录 Chrome 应用商店状态：v0.4.0 自 2026-11-07 起公开上架；v0.5.0 更新于 2026-11-26 提交审核、状态「待审核」。据此更正特性说明中「未上架 Chrome Web Store」的表述；0.5.0 发布说明中的同类表述保留原样，以验收记录为准。
- Recorded the Chrome Web Store status: v0.4.0 has been publicly listed since 2026-11-07, and the v0.5.0 update was submitted for review on 2026-11-26 (pending). The feature pages were corrected accordingly; the v0.5.0 release notes keep their original wording as a historical record.

## 0.5.0 — 2026-11-26

### Added / 新增

- 截止日期默认不设置；点击“设置截止日期”时填入当天。只设日期的任务默认当天 09:00 提醒，可在“设置 → 提醒”修改时间或关闭全天提醒；设置具体时间的任务到点提醒。
- Due dates remain unset until “Set due date” fills today. Date-only tasks notify at 09:00 by default, adjustable or switchable in Settings → Reminders; timed tasks notify at their due time.
- 新增本机后台定时和系统通知；完成、删除或清除日期会取消待发提醒，同一次截止安排正常运行及重启后不重复通知。首次加载不补发历史过期任务；已登记但错过的提醒恢复后补发。
- Added local background alarms and system notifications, cancellation on completion/deletion/date removal, and persistent deduplication. Initial loading skips historical overdue tasks; previously registered missed reminders are caught up.
- 新增可选的本地外部读取接口：在“设置 → 导入 / 导出 → 外部工具读取”中选择空白 JSON 文件后，插件在数据保存后把只读快照写入该文件。配套 `omntt` CLI 与 Skill 从仓库源码获取，不包含在扩展 ZIP 中。
- Added an optional local external interface: after selecting an empty JSON file under Settings → Import / Export → External tool access, the extension writes a read-only snapshot to it after persisted changes. The companion `omntt` CLI and skill come from the repository source and are not included in the extension ZIP.

### Changed / 变更

- 新增薄荷绿叠卡扩展标识，并统一新标签页的操作图标。
- Added a mint stacked-card extension mark and unified the new tab page action icons.

### Fixed / 修复

- 恢复旧版恢复点时补齐新增设置默认值，避免数据已保存却被页面误报为失败。
- Defaults for new preferences are applied when restoring older recovery points, preventing false failure reports after successful persistence.

### Permissions and limits / 权限与限制

- 新增 `alarms` 和 `notifications` 权限；任务标题及截止信息会显示在系统通知中。需保持 Chrome 运行并允许通知；休眠、免打扰或浏览器关闭可能延迟提醒。操作系统通知显示仍需人工确认。
- Added `alarms` and `notifications` permissions. Notifications expose task titles and due information to the system notification center. Chrome must be running with notifications allowed; sleep, Do Not Disturb, or closing the browser can delay delivery. OS notification presentation still needs manual verification.
- 外部快照包含明文任务，不是完整备份；停止导出或卸载不会删除该文件。浏览器重启后可能需要分别重新授权读取和写入。
- External snapshots contain plaintext tasks and are not full backups; stopping export or uninstalling does not delete the file. After a browser restart, read and write permission may need to be granted again.
- 仍需手动更新已解压安装目录；尚未上架 Chrome Web Store，也不支持跨设备自动同步。
- Unpacked installations still require manual updates; the extension is not on the Chrome Web Store and does not sync across devices.

### Documentation / 文档

- 新增外部工具读取固定 JSON 文件的设计记录，说明无桥接程序方案、文件契约、自动刷新及权限边界。
- Added the external JSON interface design, covering a bridge-free approach, the file contract, automatic refresh, and permission limits.
- 补录 v0.3.0 发布工作流、下载附件及 SHA-256 的实际验收结果。
- Recorded the actual v0.3.0 release workflow, downloaded asset, and SHA-256 verification results.
- 新增 Chrome Web Store 提交材料：中英文介绍、隐私填写参考、1280×800 截图与 440×280 宣传图。截图需在提交前用 v0.5.0 构建重拍；尚未提交审核。
- Added Chrome Web Store submission materials: bilingual listing, privacy guidance, 1280×800 screenshots, and a 440×280 promo tile. Screenshots must be recaptured from the v0.5.0 build before submission; nothing has been submitted for review.

## 0.4.0 — 2026-11-03

### Added / 新增

- 新增卡片时可设置创建时间，默认填入当前本地日期和时间。
- New cards let you set their creation time, defaulting to the current local date and time.

### Limits / 限制

- 仍需手动更新已解压安装目录；尚未上架 Chrome Web Store，也不支持跨设备自动同步。
- Unpacked installations still require manual updates; the extension is not on the Chrome Web Store and does not sync across devices.

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

# 截止提醒验收 / Due reminder verification

日期 / Date: 2026-11-04。

本记录保留发布前实现验收事实；正式版本发布结果见 [v0.5.0 验收](verification-v0.5.0.md)。/ This record preserves pre-release implementation evidence; see [v0.5.0 verification](verification-v0.5.0.md) for publication results.

范围 / Scope: `codex/due-reminders` 未发布开发分支，基于 v0.4.0；不是新版本发布记录。/ Unreleased feature branch based on v0.4.0; this is not a release record.

## 已执行检查 / Executed checks

| 检查 / Check | 结果 / Result |
| --- | --- |
| 修改前基线 / Baseline `npm test` | 46/46 通过 / passed. |
| TDD 红灯 / RED evidence | 新日期/设置测试因功能缺失失败；后台服务空实现时 8 项行为断言失败；扩展基线缺少设置日期按钮、提醒设置页和通知权限，4 项新流程失败。/ New date/settings behavior failed before implementation; eight service assertions failed with an empty service; four new extension workflows failed against the old build. |
| `npm run check` | 通过：Prettier、63 项单元测试、严格类型检查与构建、37 项 Chromium 扩展验收。/ Passed: Prettier, 63 unit tests, strict TypeScript/build, and 37 Chromium extension tests. |
| 扩展后台链路 / Background integration | Chrome 原生闹钟设置、取消及所有扩展页面关闭后的通知投递通过。仅通知创建接口被捕获，存储、后台 writer 与 Chrome 闹钟事件均实际运行。/ Native alarm scheduling/cancellation and delivery with all extension pages closed passed. Only the OS notification boundary is captured; storage, the writer, and Chrome alarm events run normally. |
| 原生通知 API / Native notification API | 独立 Chromium 配置中，未替换原生接口，`getPermissionLevel` 返回 `granted`，使用自有 PNG 图标的 `create` 成功，`getAll` 可列出通知，随后清除测试通知。/ In an isolated Chromium profile with unmodified APIs, permission was `granted`, native `create` accepted the owned PNG icon, `getAll` listed the notification, and the synthetic notification was then cleared. |
| 兼容与失败路径 / Compatibility and failures | 本地日期、夏令时缺失/重复小时、时区变化、无效旧日期/时间、全天开关、旧备份默认、完整备份/恢复、未知字段、后台重启去重、改期、完成/删除/孤立卡片取消、隐藏看板提醒、通知与持久化失败均有覆盖。/ Covered local dates, DST gaps/folds, timezone changes, invalid legacy dates/times, settings compatibility, backups/recovery, unknown fields, deduplication, rescheduling, cancellation, hidden boards, and notification/storage failures. |
| 合成截图 / Synthetic screenshots | 已逐张检查 `docs/images/due-reminders-zh.png`、`due-reminders-en.png`、`reminder-settings-zh.png`、`reminder-settings-en.png`，无截断、重叠；Escape 可关闭弹窗。独立测试配置，不访问日常 Chrome 资料。/ Both language forms and settings were visually inspected for clipping/overlap; Escape closes dialogs. Screenshots use isolated Chromium profiles and synthetic content. |
| 打包与校验 / Packaging and checksum | `npm run package:dist` 通过：10 个白名单文件；在 `release/` 中执行 `shasum -a 256 -c SHA256SUMS.txt` 通过。本地开发 ZIP SHA-256：`c814840201b4280e3b58675357dc18d8c8cb5f5dcae7b1772887be3793fe8b2f`。包名沿用基础版本 `0.4.0`，不是公开 Release 的安装包。/ Packaging passed with ten allowlisted files and matching checksum. This local development archive retains the base version and is not the published v0.4.0 archive. |
| 独立审查 / Independent review | 一次只读审查发现旧恢复点缺少新布尔设置会导致客户端误报失败；已用真实旧选项结构复现 RED，并在恢复时合并默认值后通过 GREEN（设置/恢复测试 5/5）。无其他 Critical/Important/Minor 问题；修复后 `npm run check` 全部通过（63 项单元、37 项浏览器验收），重新打包并校验相同构建。/ One read-only review found the legacy recovery-options regression. A genuine old-options fixture reproduced it, and normalizing defaults before persistence/return made the regression green (5/5 settings/recovery tests). No other critical, important, or minor issues were reported; the full check passed after the fix (63 unit and 37 browser tests), followed by packaging/checksum verification of that build. |

## 产品规则 / Product behavior

默认无日期；点击设置时才填入今天。只设日期默认当天 09:00 提醒，设置中可修改或关闭全天提醒；具体时间提醒独立生效。完成、删除、清除日期或删除所属看板会取消待发提醒。历史过去日期不会在首次升级/导入时集中补发；已登记、停机期间错过的提醒在恢复后补发一次。

No due date by default; enabling it fills today's local date. Date-only tasks notify at 09:00 by default, adjustable or switchable in settings. Explicit-time reminders remain independent. Completing/deleting/removing dates or deleting the owning board cancels pending reminders. Initial imports skip historical past dates; registered reminders missed during downtime are caught up.

提醒选项保存在既有 options 中；`allDayReminders` 缺失时默认 true，`allDayReminderTime` 缺失时默认 `09:00`。投递记录位于独立的 `reminder_delivery_v1` 本机存储键，不进入完整备份或恢复快照，不增加任务 revision。

Preferences stay in existing options with backward-compatible defaults. The separate `reminder_delivery_v1` local delivery ledger is excluded from exports/recovery snapshots and does not change task revisions.

删除/清空任务会清理相应投递历史，随后恢复任务可能重新通知；将备份带到其他配置也不携带投递历史。/ Deleting/clearing tasks removes the corresponding delivery history, so restoring them can notify again. Backups moved to another profile do not carry delivery history.

## 未覆盖与平台边界 / Limits

- 自动化没有验证 macOS/Windows/Linux 通知中心实际弹出的视觉效果、锁屏、声音或免打扰；需在目标系统允许 Chrome 通知后人工确认。/ Automation does not verify OS notification presentation, lock screen, sounds, or Do Not Disturb; target-system manual verification remains necessary.
- 未逐个运行全部 Chrome 120+ 版本，也没有访问或修改日常浏览器配置。/ Not every Chrome 120+ version was tested; the everyday browser profile was not accessed or changed.
- Chrome 关闭、休眠或通知被禁用时不能承诺准点；Vite 网页预览不发送系统提醒。/ Chrome shutdown, sleep, or disabled notifications prevent punctuality guarantees; Vite previews do not send system reminders.
- 通知创建与投递记录不能原子提交。极端崩溃窗口可能重复展示稳定 ID 的同一通知；正常运行、页面刷新和后台重启路径有去重测试。/ Notification creation and ledger writes are not atomic. An exceptional crash window can redisplay the same stable-ID notification; normal operation, page refresh, and worker restart paths are covered by deduplication tests.
- 无推送、tag、合并或 GitHub Release；公开安装包仍为 v0.4.0。/ No push, tag, merge, or GitHub Release; the public archive remains v0.4.0.

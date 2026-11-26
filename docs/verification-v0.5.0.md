# v0.5.0 发布验收 / Release verification

日期 / Date: 2026-11-04。

发布提交 / Release commit: 待合并、打 tag 后记录 / Pending merge and tag verification.

## 范围 / Scope

默认无截止日期，启用时填入今天；全天提醒默认 09:00，可调整或关闭，具体时间提醒独立生效。新增 Chrome 本机后台定时和系统通知、持久化投递去重与取消；兼容旧备份与恢复点。/ Optional due dates with today's date on activation; configurable 09:00 all-day reminders and independent timed reminders. Adds local background alarms/system notifications, durable deduplication and cancellation, with legacy backup/recovery compatibility.

## 本地核对 / Local checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| 实现阶段验收 / Implementation acceptance | [实现验收记录](verification-due-reminders.md)：63 项单元、37 项浏览器验收通过；原生通知 API 成功；独立审查发现的旧恢复点回归已通过 RED→GREEN 修复。/ Implementation passed 63 unit/37 browser tests and a native notification API check; the reviewed legacy recovery regression was fixed with RED→GREEN evidence. |
| v0.5.0 `npm run check` | 待执行 / Pending. |
| `npm run package:dist` / ZIP / SHA-256 | 待执行 / Pending. |
| 版本一致性 / Version alignment | package、lockfile、manifest、模型常量、首页和关于页统一为 `0.5.0`；发布 tag 应为 `v0.5.0`。/ Package, lockfile, manifest, model, homepage, and About use `0.5.0`; the release tag must be `v0.5.0`. |
| 合成截图 / Synthetic screenshots | 复核中英文新增日期表单及提醒设置截图，见 `docs/images/due-reminders-{zh,en}.png` 与 `reminder-settings-{zh,en}.png`；版本文字未出现在这四张截图中，无需重拍。/ Reviewed both language forms/settings screenshots; these four images contain no version text and remain accurate. |
| 双语文档 / Paired documentation | README、features、CHANGELOG 与 Release notes 同步刷新；隐私说明更新权限和通知内容。/ Paired README/features, CHANGELOG, and release notes refreshed, plus privacy permissions and notification content. |
| 条件文档 / Conditional review | 规格/计划追加发布授权与记录入口；AGENTS、贡献指南、开发命令、发布工作流、依赖和许可证无变化，无需修改。自有通知图标纳入白名单资源。/ Spec/plan add publication follow-up; contributor guidelines, commands, workflows, dependencies and licenses are unchanged. The owned notification icon is an allowlisted asset. |

## 远端核对 / Remote checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| 版本 PR 与 CI / Release PR and CI | 待推送后记录 / Pending push. |
| Tag / 发布工作流 | 待本地及 PR 检查通过后发布 / Pending successful local/PR checks. |
| GitHub Release / 下载附件 | 待下载 ZIP 与 SHA256SUMS 复核 / Pending publication and downloaded asset verification. |

## 已知边界 / Limits

Chrome 必须运行且通知被允许；休眠、浏览器关闭、免打扰可能延迟提醒。自动化测试验证后台调度及通知接口，未验证各操作系统的通知横幅、声音、锁屏，也未逐版测试全部 Chrome 120+。通知创建与投递记录不原子，极端崩溃窗口可能重复；删除/清空后恢复、跨配置转移备份也可能重新通知。/ Chrome must run with notifications allowed. Sleep, shutdown and Do Not Disturb may delay delivery. Tests cover background scheduling/APIs, not every OS banner, sound, lock screen, or Chrome 120+ version. An exceptional crash window or restoring deleted/cleared/transferred tasks can notify again.

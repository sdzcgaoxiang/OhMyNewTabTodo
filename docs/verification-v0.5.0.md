# v0.5.0 发布验收 / Release verification

日期 / Date: 2026-11-26。

发布提交 / Release commit: 待合并、打 tag 后记录 / Pending merge and tag verification.

## 范围 / Scope

截止日期默认留空，启用时填入今天；只设日期默认 09:00 全天提醒，可调整或关闭，具体时间提醒独立生效。新增 Chrome 本机后台定时和系统通知、持久化投递去重与取消；兼容旧备份与恢复点。同版包含可选的本地外部只读 JSON 快照接口（`omntt` CLI 与配套 Skill 从源码获取）、重绘的扩展与页面图标，以及 Chrome Web Store 提交材料（仅文档，截图待重拍，未提交审核）。/ Optional due dates that fill today when enabled, with a configurable 09:00 all-day reminder and independent timed reminders; adds local background alarms and system notifications with durable deduplication and cancellation, keeping legacy backup and recovery compatibility. The same release ships the optional local read-only JSON snapshot interface (`omntt` CLI and skill from source), the redrawn extension and page icons, and Chrome Web Store submission materials (documentation only; screenshots to be recaptured, nothing submitted).

## 本地核对 / Local checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| 截止提醒实现验收 / Due-reminder implementation acceptance | [实现验收记录](verification-due-reminders.md)：63 项单元、37 项浏览器验收通过；原生通知 API 成功；独立审查发现的旧恢复点回归已通过 RED→GREEN 修复。/ Passed 63 unit and 37 browser tests with a native notification API check; the reviewed legacy recovery regression was fixed RED→GREEN. |
| 外部接口实现验收 / External interface acceptance | [外部接口验收记录](verification-external-file-interface.md)：2026-11-10 在隔离 macOS / Chromium 156 用真实文件选择器验收，完全退出后 CLI 仍可读取；重启后需分别重新授权读写。其余平台未验证。/ Verified on isolated macOS / Chromium 156 with the real file picker; the CLI read snapshots after a full browser exit, and restart required separate read and write re-authorization. Other platforms are unverified. |
| v0.5.0 `npm run check`（合并 `origin/main` 含 PR #7、#8 之后）/ after merging `origin/main` with PR #7 and #8 | 通过：prettier 检查、`tsc` 两个项目、Vite 构建、**71 项单元测试**（71 过 / 0 败）、**46 项 Chromium 浏览器测试**（46 过）。浏览器测试含提醒 4 项、图标 1 项、外部接口 8 项（含重启测试）。构建提示 `src/client.ts` 同时被静态与动态导入的 Vite 警告，不影响产物。/ Passed: prettier, both `tsc` projects, Vite build, **71 unit tests** (71 pass / 0 fail), and **46 Chromium browser tests** (46 pass), including 4 reminder, 1 icon, and 8 external-interface tests with the restart case. Vite warns that `src/client.ts` is both statically and dynamically imported; the output is unaffected. |
| `npm run package:dist` / ZIP / SHA-256 | 通过：14 个白名单文件（manifest、index、background、3 个 assets、提醒图标、4 个扩展图标、两种语言目录、LICENSE）；`shasum -a 256 -c SHA256SUMS.txt` 通过。包内 manifest 版本 `0.5.0`，权限 `storage`、`alarms`、`notifications`。本地 ZIP SHA-256：`cab4f9f7ff3c7475aab41a20ce8540ba3a12786322e4e7116939d986dfa3eb15`；与 GitHub Release 附件因构建环境与时间戳不同而不是同一份文件，以发布后下载复核为准。/ Passed with fourteen allowlisted files and a matching checksum. The local archive is for local verification only; the published asset is verified separately below. |
| 版本一致性 / Version alignment | `package.json`、lockfile、manifest、`src/model.ts`、首页与关于页统一为 `0.5.0`；发布 tag 应为 `v0.5.0`。/ Package, lockfile, manifest, model constant, homepage, and About all read `0.5.0`; the release tag must be `v0.5.0`. |
| 合成截图 / Synthetic screenshots | 新增 `docs/images/due-reminders-{zh,en}.png`、`reminder-settings-{zh,en}.png`、`external-file-{zh,en}.png` 与 `icon-redesign-preview.png`，均为隔离浏览器与合成数据。商店截图 `docs/store/images/screenshot-*.png` 摄于 2026-11-05，早于最终图标与提醒设置，**提交商店前必须重拍**。/ New feature screenshots use isolated browsers and synthetic data. The store screenshots predate the final icons and reminder settings and must be recaptured before store submission. |
| 双语文档 / Paired documentation | README、features、CHANGELOG、Release notes、PRIVACY（新增英文全文）同步刷新，覆盖提醒、外部接口、图标与商店材料；隐私说明更新权限、通知内容与外部快照。/ Paired README/features, CHANGELOG, release notes, and PRIVACY (now fully bilingual) cover reminders, the external interface, icons, and store materials, including permissions, notification content, and external snapshots. |
| 条件文档 / Conditional review | `docs/releasing.md` 增加 Chrome Web Store 提交步骤；AGENTS、贡献指南、开发命令、发布工作流、依赖和许可证无变化，无需修改。自有通知图标纳入白名单资源。/ The release checklist gains the Chrome Web Store step; contributor guidelines, commands, workflows, dependencies, and licenses are unchanged. The owned notification icon is an allowlisted asset. |

## 远端核对 / Remote checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| 版本 PR 与 CI / Release PR and CI | 待推送后记录 / Pending push. |
| Tag / 发布工作流 | 待本地及 PR 检查通过后发布 / Pending successful local/PR checks. |
| GitHub Release / 下载附件 | 待下载 ZIP 与 SHA256SUMS 复核 / Pending publication and downloaded asset verification. |
| Chrome Web Store | 待 Release 发布后下载同一 ZIP、重拍截图并提交；记录审核与上架状态 / Pending: download the released ZIP, recapture screenshots, submit, and record review and listing status. |

## 已知边界 / Limits

Chrome 必须运行且通知被允许；休眠、浏览器关闭、免打扰可能延迟提醒。自动化测试验证后台调度及通知接口，未验证各操作系统的通知横幅、声音、锁屏，也未逐版测试全部 Chrome 120+。通知创建与投递记录不原子，极端崩溃窗口可能重复；删除/清空后恢复、跨配置转移备份也可能重新通知。外部接口的真实文件选择与重启后授权恢复只在 macOS / Chromium 156 的隔离环境验证；Windows、Linux、持续授权选项、多浏览器配置竞争及断电持久性未验证。/ Chrome must run with notifications allowed. Sleep, shutdown, and Do Not Disturb may delay delivery. Tests cover background scheduling and APIs, not every OS banner, sound, lock screen, or Chrome 120+ version. An exceptional crash window or restoring deleted/cleared/transferred tasks can notify again. The external interface's real file picker and post-restart re-authorization were verified only on isolated macOS / Chromium 156; Windows, Linux, persistent-grant modes, multi-profile contention, and power-loss durability are unverified.

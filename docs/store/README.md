# Chrome Web Store 提交材料 / Submission materials

适用范围：v0.5.0 商店资料，初版准备于 2026-11-05，2026-11-26 随 v0.5.0 发布分支更新。v0.4.0 自 2026-11-07 起已在 Chrome 应用商店公开上架；v0.5.0 更新已于 2026-11-26 提交审核、当前为「待审核」，审核结果与实际上架状态记入 [v0.5.0 验收记录](../verification-v0.5.0.md)。

## 上传文件

- 扩展包：v0.5.0 已于 2026-11-26 发布。从 [v0.5.0 Release](https://github.com/sdzcgaoxiang/OhMyNewTabTodo/releases/tag/v0.5.0) 下载 `OhMyNewTabTodo-0.5.0.zip` 和 `SHA256SUMS.txt`，运行 `shasum -a 256 -c SHA256SUMS.txt`（发布 ZIP SHA-256 应为 `661bf25c01fd89854efc659e0ff1102ea2ba95d560f8867f6748ef01cec10881`），再把**下载的同一个 ZIP**上传到 Chrome Web Store。ZIP 根目录直接包含 `manifest.json`。
- 扩展图标：`public/icons/128.png`，也已包含在扩展包中。
- 中文截图：`docs/store/images/screenshot-zh.png`；英文截图：`docs/store/images/screenshot-en.png`。均为 1280×800，2026-11-26 用 v0.5.0 构建重拍（含新图标、截止日期、优先级与已完成卡片），只使用合成任务数据。另附可选浅色主题变体 `screenshot-zh-light.png` / `screenshot-en-light.png`；商店最多 5 张 1280×800，可按需上传。
- 可选小宣传图：`docs/store/images/promo-440x280.png`（2026-11-05 制作，深色主题）。
- 重拍截图：先 `npm run build`，再 `node scripts/capture-store-shots.mjs`，脚本会加载 `dist/` 中的扩展、注入合成数据并输出上述四张截图。

注意：不要使用本地 `release/` 目录中的历史测试包（它们与 GitHub Release 附件不是同一份文件），只上传 Release 附件。商店后续更新需递增版本号并重拍截图。现有解压安装与商店安装通常具有不同的扩展身份和独立存储；迁移前应从旧安装导出完整备份，在商店版导入并核对后再考虑移除旧安装。

## 商店介绍：简体中文

**名称：** OhMyNewTabTodo

**简短说明：** 在新标签页整理待办，数据保存在本机，支持备份和导入。

**详细说明：**

打开新标签页，使用横向看板整理任务。OhMyNewTabTodo 将任务保存在当前浏览器配置中，让你随时查看进度，并通过文件手动备份或迁移。

- 创建和排序看板，添加、编辑、完成、复制或移动卡片。
- 为卡片填写描述、链接、优先级、标签、创建时间和截止日期。
- 设置截止提醒：只填日期默认当天 09:00 通知，填具体时间则到点通知；后台提醒不依赖页面保持打开，可在设置中调整或关闭。
- 使用深浅主题、常用链接、搜索入口及中英文界面。
- 预览并导入兼容的 NewTabTodo JSON，或导出包含设置的完整备份。
- 多个打开的标签页接收更新；发生过期编辑时提示冲突。

本扩展会替换 Chrome 新标签页。数据保存在当前浏览器配置中，没有跨设备自动同步；请定期导出完整备份。卸载扩展会删除其本地数据。提醒通过本机系统通知显示，不经过网络；搜索或打开链接时，浏览器会访问你选择的网站。

本项目为独立实现，与 NewTabTodo 原作者无关联。

## Store listing: English

**Name:** OhMyNewTabTodo

**Short description:** Organize tasks on your new tab, with local storage and file backups.

**Detailed description:**

Organize your tasks on a horizontal board whenever you open a new tab. OhMyNewTabTodo stores your tasks in the current browser profile and lets you back up or move them using files.

- Create and reorder boards; add, edit, complete, copy, and move cards.
- Add descriptions, links, priorities, tags, creation times, and due dates.
- Set due reminders: date-only tasks notify at 09:00 by default and timed tasks at their due time, delivered in the background even with the page closed; adjust or disable them in Settings.
- Choose a light or dark theme, quick links, a search entry point, and an English or Chinese interface.
- Preview and import compatible NewTabTodo JSON, or export a full backup that includes settings.
- Receive updates across open tabs and see a conflict warning for stale edits.

This extension replaces Chrome's new tab page. Data stays in the current browser profile and does not sync automatically across devices; export full backups regularly. Uninstalling the extension deletes its local data. Reminders appear as local system notifications without network access; when you search or open a link, your browser visits the site you choose.

This is an independent implementation and is not affiliated with the original NewTabTodo author.

## Privacy practices 填写参考

- Single purpose：Provide a new tab page for organizing and managing tasks on boards.
- `storage` justification：Store the user's boards, cards, settings, and up to three recovery snapshots in the current browser profile so the new tab page can persist and restore them.
- `alarms` / `notifications` justification：Schedule due-date reminders locally and show them as system notifications; no network requests.
- Remote code：No。扩展的可执行代码随包提供；搜索和打开链接由用户主动触发。
- 数据处理：任务、描述、链接和导入文件在本机处理；开发者不接收或上传。主动搜索时，所选搜索引擎会通过 URL 收到搜索词。根据后台当时对各数据类别的定义逐项核对；本地处理不应被误写成扩展完全不接触用户数据。仅在确认符合相关声明后勾选认证。
- 隐私政策 URL：先将根目录 `PRIVACY.md` 的更新合并并公开，再使用 `https://github.com/sdzcgaoxiang/OhMyNewTabTodo/blob/main/PRIVACY.md`，并确认未登录也可访问且显示 0.5.0 内容（含 `alarms` / `notifications` 权限和外部只读接口）。
- 支持 URL：`https://github.com/sdzcgaoxiang/OhMyNewTabTodo/issues`，公开前确认可访问。
- 类别、发布地区、公开方式、开发者联系邮箱和各项认证：在后台按账号和实际发行计划填写；不要替开发者虚构。

Google 参考文档：[图片要求](https://developer.chrome.com/docs/webstore/images/)、[隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)、[首次提交](https://developer.chrome.com/docs/webstore/publish)。

## 本地验证 / Local verification — 2026-11-26（v0.5.0）

- `npm run check`：格式、类型检查和构建通过；71 项单元测试、46 项 Chromium 浏览器测试通过。详见 [v0.5.0 验收记录](../verification-v0.5.0.md)。
- `npm run package:dist`：从已验证的构建生成 14 个文件的 ZIP（含 4 个扩展图标与提醒图标）；`shasum -a 256 -c SHA256SUMS.txt` 通过。仅供本地验证的 0.5.0 ZIP SHA-256：`cab4f9f7ff3c7475aab41a20ce8540ba3a12786322e4e7116939d986dfa3eb15`；上传时必须改用 GitHub Release 附件。
- 已核对宣传图（440×280）、截图（1280×800）及扩展图标（16/32/48/128）尺寸。截图于 2026-11-26 用 v0.5.0 构建重拍并目视检查（新图标、截止日期、优先级、已完成卡片均正确）。同日把上述素材用于已上架条目（`lljakpfpennhcfdmlakjkonfcchkcjim`）并提交审核，状态「待审核」；审核结论未出，不表示已通过。
- 历史记录：2026-11-05 基于 0.4.0 的本地测试 ZIP（13 个文件，SHA-256 `44222e61…14f86`）已被 v0.5.0 取代，不要再使用。

# 隐私说明

适用范围：OhMyNewTabTodo 0.5.0；更新于 2026-11-26。

扩展在本机处理你输入或导入的看板、任务和书签，以提供功能；开发者不收集或上传这些内容、搜索词、设备标识或使用统计。没有账号、遥测、广告、远程脚本、远程字体或后台同步服务。开发者无法读取你保存在浏览器中的任务。

扩展申请 `storage` 权限，用于保存当前 Chrome 配置内的数据、设置和最近 3 份恢复快照。从 0.5.0 起另外申请 `alarms` 和 `notifications` 权限，用于截止提醒的本机调度与系统通知；不增加网络访问。双语界面的语言选择及全天提醒设置作为本机设置保存，并包含在完整备份中。新标签页覆盖由 manifest 声明。它不申请浏览历史、网页内容、所有站点访问或系统剪贴板权限，也不会读取其他扩展的数据。

截止提醒会将任务标题与截止日期/时间显示给系统通知中心，可能出现在锁屏上，显示方式受系统通知设置控制；任务描述不会进入通知。待发安排与已通知记录仅保存在当前浏览器本机存储，不包含在导出文件和恢复快照中。清空任务或删除卡片后会清理相应投递记录；卸载扩展删除全部本机记录。通知调度不访问 Apple 或外部推送服务，不与 iPhone 同步。

## 外部只读接口

用户主动开启后，插件可将任务明文写入用户选择的本机 JSON 文件，供 CLI 和其他本机工具只读；文件不包含恢复点和书签。插件不会上传该文件。停止导出或卸载扩展后，文件仍保留；文件位置、访问权限及分享由用户管理。该功能包含在 0.5.0 中。

导入文件在本机解析；导出通过浏览器下载文件。JSON 备份包含明文任务、描述和链接，没有另行加密，请自行选择保存和分享位置。卸载扩展会删除本地数据，导出的文件仍保留在你选择的位置。

只有你主动执行搜索、打开任务中的链接、常用链接或 GitHub 链接时，浏览器才访问相应网站。搜索词通过 URL 发送给你选择的搜索引擎，目标网站适用其自身的隐私政策。这些操作不是数据同步。

报告问题时请不要上传真实导出文件或含个人内容的截图。可以提交人工构造的最小样例；如需讨论隐私问题，使用仓库 Issue，并避免公开任何敏感内容。

## English

Applies to OhMyNewTabTodo 0.5.0. Updated November 26, 2026.

The extension processes boards, tasks, and bookmarks you enter or import on your device to provide its features. The developer does not collect or upload this content, search terms, device identifiers, or usage statistics. There are no accounts, telemetry, ads, remotely hosted scripts or fonts, or background synchronization. The developer cannot read tasks stored in your browser.

The extension requests the `storage` permission to save data, settings, and up to three recovery snapshots in the current Chrome profile. Since 0.5.0 it also requests `alarms` and `notifications` for local reminder scheduling and system notifications, with no additional network access. The language choice and all-day reminder preferences are stored locally and included in full backups. The new tab override is declared in the manifest. The extension does not request browsing history, page content, access to all sites, or system clipboard permissions and does not read other extensions' data.

Due reminders show task titles and due dates or times to the system notification center, where they may appear on the lock screen; presentation follows your system notification settings. Task descriptions never enter notifications. Pending schedules and delivered records stay in the browser's local storage and are excluded from exports and recovery snapshots. Clearing or deleting tasks removes the related delivery records; uninstalling removes all local records. Scheduling does not contact Apple or any external push service and does not sync with iPhone.

## Read-only external interface

When you enable it, the extension can write plaintext tasks to a local JSON file you choose so that the CLI and other local tools can read it; the file contains no recovery points or bookmarks. The extension never uploads this file. The file remains after you stop exporting or uninstall the extension; its location, permissions, and sharing are yours to manage. This feature is included in 0.5.0.

Imports are parsed locally and exports are saved through browser downloads. JSON backups contain unencrypted tasks, descriptions, and links. Uninstalling the extension deletes its local data; exported files remain where you saved them.

Only when you actively search or open a task link, quick link, or GitHub link does the browser visit the corresponding site. Search terms are sent in the URL to your chosen search engine, and the destination site's privacy policy applies. These actions are not data synchronization.

Please do not post real backups or screenshots containing personal information in issue reports. Use a synthetic example and contact the project through its repository Issues page.

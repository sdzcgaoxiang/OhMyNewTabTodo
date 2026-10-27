# TypeScript 迁移验收 / TypeScript migration verification

日期：2026-10-27。范围：将业务源码、测试和 Vite/Playwright 配置迁移到严格检查的 TypeScript；产品版本仍为 0.1.0，本记录不代表新版本已发布。

**Result (English):** Application source, tests, and development configuration now pass strict TypeScript checks. Synthetic compatibility, browser workflows, and package checks passed. The data schema, extension permissions, UI/CSS, and release version did not change; this work has not been published.

## 实际执行

| 命令或检查 | 结果 |
| --- | --- |
| 迁移前 `npm run check` | 26/26 单元测试、16/16 浏览器测试、格式和构建通过 |
| `npm run format` | 完成；根目录 TS/JSON、源码、测试、脚本和工作流均在格式检查范围内 |
| `npm run check` | 严格类型检查、31/31 单元测试、构建、17/17 浏览器测试通过 |
| `npm run package` | 构建并生成 7 文件 ZIP 和 SHA-256；`unzip -Z1` 清单无 TypeScript 源码或额外文件 |
| Node.js 22.12.0 下 `npm run typecheck && npm test && npm run build` | 通过；与当前本机 Node.js 22.22.0 的检查结果一致 |

ZIP：`OhMyNewTabTodo-0.1.0.zip`，SHA-256：`3160428ab98efdf61a424c00d281141bd7fc6899056e783ebdaed1f43ac744da`。ZIP 内仅包含 `LICENSE.txt`、`index.html`、`manifest.json`、`background.js` 和 3 个 `assets/` 文件；Manifest 的 worker 路径存在。`dist/` 与 ZIP 均没有 `.ts` / `.tsx` 文件。安装包只在本地验证，未发布。

## 兼容与交互证据

- 合成旧 `app_state` 在隔离 Chromium 中直接读取，revision 17 保留；编辑后变为 18，未知顶层字段保留。未清空或重建存储。
- 合成旧备份的 `null` 描述、未知优先级、额外标签和嵌套自定义字段在导入及完整导出后保留；缺 `bookmarks` 和孤立看板用例继续通过。
- 多标签页冲突、移动后旧草稿、写入失败、恢复点、过期预览与最后一次文件选择由现有和新增用例覆盖。
- 使用合成数据重新截取 1440×900 的扩展界面供本次评审，并与现有公开看板截图核对；布局未改，故保留现有公开截图。
- 打包测试在注入意外 `.ts` 文件时拒绝打包；恢复原文件清单后打包与校验和通过。

迁移阶段提交：`f8b4fbc`（类型契约）、`ad50240`（模型与备份）、`b57be48`（存储与通信）、`b7de008`（UI 与测试）。配置、文档和最终验收属于包含本记录的收口提交。

## 最终审查

独立审查代理因账户使用额度限制未能执行；作者按同一审查清单复核了迁移差异。复核发现存储读取和后台响应的类型断言覆盖了未验证的输入。新增两条先失败的测试，分别复现无效书签集合与缺少 state 的成功响应；随后增加只读结构检查和响应收窄。修复后 `npm run check` 为 31/31 单元测试、17/17 浏览器测试通过，`npm run package` 通过。作者自审弱于独立审查，合并前可另行安排复核。

## 未测边界

未读取或写入用户真实 Chrome 配置和私人备份；未逐一运行 Chrome 120 至当前版本，也未在 GitHub Actions 上执行本分支。真实旧版本历史文件的兼容性仍受现有合成样例及既有审计范围限制。没有发布新安装包或更改 Chrome Web Store 状态。

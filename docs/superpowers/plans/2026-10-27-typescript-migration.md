# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将业务源码、测试和开发配置迁移到严格检查的 TypeScript，保持 v0.1.0 的界面行为、数据兼容及后台单写架构。

**Architecture:** 沿用 React、Vite、Manifest V3、Node test runner 和 Playwright。按领域模型 → 文件兼容 → 持久化/通信 → UI 的依赖顺序迁移；用独立类型检查覆盖生产代码、测试和配置，构建仍输出浏览器执行的 JavaScript。

**Tech Stack:** 现有技术栈；新增开发依赖 TypeScript、tsx、@types/react、@types/react-dom、@types/chrome、@types/node。实施时核对兼容版本并锁定，不顺带升级 React/Vite。

**Spec:** [v1 行为规格](../specs/2026-10-27-v1-design.md)、[兼容性约束](../../research/newtabtodo-compatibility.md)，以及本文的迁移约束。历史规格记录原实现，不批量改写为 TypeScript。

**Status:** 已按用户 2026-10-27 的迁移指令执行；实际结果见 [验收记录](../../verification-typescript-migration.md)。

## Global Constraints

- 保持 Node.js `>=22.12.0`、npm、Chrome 最低版本 120；不提高运行环境门槛。
- 保持 `app_state`、`schemaVersion: 1`、现有导入/导出格式和旧 ID；升级扩展不需要清空或重建数据。
- 保留未知业务字段、未知优先级、额外标签、空值及现有兼容规则；类型描述真实数据，不能反过来缩窄已接受的备份。
- 所有变更仍通过 background writer；保留串行队列、revision、编辑基线、失败传播和最多 3 个恢复点。
- JSON、存储与消息是运行时边界；静态类型不替代现有验证，不以类型断言冒充验证。
- 本轮不开新功能，不改 UI/CSS，不换状态管理/测试框架，不引入同步、权限或联网能力。
- 最终源码开启 `strict`，不以全局 `any`、`@ts-nocheck` 或关闭严格检查作为迁移完成标准。
- 本次迁移记入 Unreleased，不升产品版本、不发布安装包。后续正式发布另按发布清单同步版本和双语资料。

## 方案与范围

| 方案 | 收益和代价 | 建议 |
| --- | --- | --- |
| 仅增加 JSDoc/checkJs | 改动较小，但最终仍是 JavaScript，达不到完整 TS 迁移目标 | 不选 |
| 分层实施，本轮完成 TS 迁移 | 每层可验证，最终业务代码、测试和配置统一为 TS | 推荐 |
| 全部一次改名后集中修错 | 初始操作快，但模型、UI 和工具链错误混在一起，兼容问题难定位 | 不选 |

迁移 `src/**/*.js` → `.ts`、`src/**/*.jsx` → `.tsx`、`tests/**/*.js` → `.ts`，以及 `vite.config.js` / `playwright.config.js` → `.ts`。

`scripts/package.mjs` 保留为可直接由 Node 执行的发布脚本；它不属于扩展业务代码，其打包白名单与运行方式无需因迁移改变。CSS、HTML、Manifest JSON 继续使用原格式，HTML 只调整源码入口。若后续要求发布脚本也采用 TS，应单独调整其子进程测试和运行方式。

## 类型与工具链设计

- 新增 `src/types.ts`：`Board`、`Card`、`Label`、`Bookmark`、`AppData`、`Options`、`Theme`、`Snapshot`、`RecoveryPoint`、`AppState`。可扩展实体使用明确已知字段和 `[key: string]: unknown`；已接受的 nullable 字段保留 `null`。`priority` 继续允许未知字符串，`history` 不假定未验证的内部结构。
- 新增 `src/operations.ts`：按 `type` 区分的 `ModelOperation` 联合类型，以及包含 `import`、`restore`、`clear` 的 `RepositoryOperation`。从现有 switch 和调用点逐项建模；破坏性操作必须携带 `expectedRevision`，编辑操作保持现有可选冲突基线语义。
- 新增 `src/protocol.ts`：`RuntimeRequest = { type: 'read' } | { type: 'dispatch'; operation: RepositoryOperation }`；`RuntimeResponse = { ok: true; state: AppState } | { ok: false; error: string }`。仅定义协议，不增加第二条写入路径。
- 导入专属类型 `ParsedImport`、`ImportStats`、`ImportOptions`、`ImportMode` 留在 `transfer.ts`；UI 局部状态和 Props 靠近对应组件，避免一个巨型全局类型文件。
- 配置 `tsconfig.json`（应用）、`tsconfig.tools.json`（Node 测试、Playwright、构建配置及类型契约测试）、`src/vite-env.d.ts`。都开启 `strict`、`noEmit`、`isolatedModules`、`verbatimModuleSyntax`；使用 `moduleResolution: 'Bundler'`、`jsx: 'react-jsx'` 和显式 `.ts`/`.tsx` 相对导入，配套 `allowImportingTsExtensions`。分开配置 DOM/Chrome 与 Node 环境类型，避免把 Node 全局误当成浏览器能力。
- 迁移期间允许 JS/TS 共存，已迁移 TS 文件必须严格检查；最终移除临时 `allowJs` 和迁移用排除规则。`noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` 作为后续独立强化项，本轮不叠加到 `strict`。
- 单元测试保留 Node runner，通过 `node --import=tsx --test tests/*.test.ts` 执行；过渡阶段仍运行现有 JS 测试。这样无需依赖不同 Node 22 小版本默认启用类型擦除的差异。
- 新增 `npm run typecheck` 检查两份配置；`npm run check` 纳入 typecheck。`npm run build` 在 Vite 构建前执行 typecheck，让直接构建/打包也拒绝类型错误；check 调用 build 时避免重复执行同一类型检查。
- Prettier 根目录 glob 同时覆盖 `.js` 和 `.ts`，并正确引用 glob，避免迁移完 `.js` 文件后因 shell 空匹配失败。

## Review Focus

1. 旧备份中的 `null`、未知优先级、额外标签及深层自定义字段：导入、普通编辑、导出后仍保留（Task 2）。
2. 既有 `app_state` 升级读取：不重置数据、不改变 schema、不要求重新导入（Task 3）。
3. 并发编辑、移动、过期预览与写入失败：拒绝冲突、保留已持久化数据、队列可继续使用（Task 3/4）。
4. 新选文件覆盖旧异步读取、关闭弹窗以及表单 `File/null`：不把旧预览或无效表单值写入状态（Task 4）。
5. 构建入口重命名：成品仍有 `background.js`，Manifest 指向有效文件，ZIP 没有 TS 源码或额外私密文件（Task 5）。

## Task 1: 建立类型检查与测试执行基础

**Files:** `package.json`、`package-lock.json`、新增 `tsconfig.json` / `tsconfig.tools.json` / `src/vite-env.d.ts` / `src/types.ts` / `src/operations.ts` / `tests/types/contracts.ts`。

**Interfaces:** 输出共享状态类型和操作联合类型；`clone<T>(value: T): T`、`emptyState(): AppState` 的迁移由 Task 2 完成。

- [ ] 实施开始时创建隔离分支/工作区，检查用户改动；运行现有 `npm run check` 并记录基线，不把已有失败归因于 TS。
- [ ] 对照 v1 规格、运行时检查和合成 fixture 建模；尤其核对字段缺省值、`null` 和未知字段。
- [ ] 安装锁定的开发依赖、配置两套类型检查和过渡期测试命令；用临时明显类型错误验证 typecheck 非零退出，随后移除临时错误。
- [ ] 在 `tests/types/contracts.ts` 增加类型契约：合法 `card.move` 可用；缺 `boardId`、非法 operation type、`clear` 缺 `expectedRevision` 应被编译器拒绝。使用带原因的 `@ts-expect-error`，检查未实现约束时会因“未产生预期错误”失败，再补齐联合类型使检查通过。
- [ ] 验证 `npm run typecheck`、现有单元测试和构建通过。保留 Node runner、Vite 和 Playwright，不另加测试框架。

## Task 2: 迁移领域模型、日期与备份兼容层

**Files:** `src/model.ts`、`src/dates.ts`、`src/transfer.ts`（由原文件重命名）；对应 `tests/model.test.*`、`tests/dates.test.*`、`tests/transfer.test.*` 和 `tests/fixtures.*` 的导入路径。

**Interfaces:** `applyOperation(input: AppState, op: ModelOperation): AppState`；`parseImport(text: string): ParsedImport`；`prepareImport(current: AppState, parsed: ParsedImport, options?: ImportOptions): AppState`；`snapshot(state: AppState): Snapshot`；`duePresentation(card: Card, now?: Date): { text: string; overdue: boolean }`。导出函数保留现有对象结构。

- [ ] 先补齐兼容规格中的类型说明，并复用现有回归测试；缺失的 nullable/未知字段往返场景增加合成 fixture。纯重命名不人为制造行为失败；新增类型契约先验证失败再实现，发现行为缺陷则先加复现测试。
- [ ] 重命名并标注纯函数、字典、日期返回值和各 operation 分支；操作补丁不能覆盖受保护的 ID/创建时间，仍保留运行时保护。
- [ ] JSON 解析结果先视为 `unknown`，用现有验证规则进行类型收窄；将 `object`、`ensure` 等辅助函数写成真实守卫/断言函数。区分验证前对象与验证后 `ParsedImport`，不直接 `JSON.parse(...) as AppState`。
- [ ] 保留缺 bookmarks、缺 cardIds 的现有补全行为，孤立对象警告、5 MiB 上限、合并幂等、冲突拒绝、副本 ID 重映射及完整备份规则。
- [ ] 运行迁移后的 model/dates/transfer 测试与 `npm run typecheck`；现有和新增兼容用例均通过才进入下一层。

## Task 3: 迁移持久化、后台与页面通信

**Files:** `src/repository.ts`、`src/background.ts`、`src/client.ts`、新增 `src/protocol.ts`；`vite.config.js` 中的后台源码入口；`tests/repository.test.*`。

**Interfaces:** `StorageArea.get(key: string): Promise<Record<string, unknown>>`、`StorageArea.set(items: Record<string, unknown>): Promise<void>`；`createRepository(area: StorageArea): { read(): Promise<AppState>; dispatch(op: RepositoryOperation): Promise<AppState> }`；`readState(): Promise<AppState>`；`dispatch(operation: RepositoryOperation): Promise<AppState>`；`subscribe(onState: (state: AppState) => void): () => void`。

- [ ] 保持存储接口可由 Chrome、开发预览和内存测试适配器实现；不把 Chrome 全量 API 类型传播到领域层。
- [ ] 保留并运行并发、worker 重启、配额失败、过期预览和恢复点测试；新增已有 v0.1.0 合成 `app_state` 原样读取用例，检查未知字段和 revision 保留。
- [ ] 为 `read` 的未知存储数据建立边界收窄；不使用会补全 ID 或改变原数据的导入流程来替代读取。若需要增加拒绝条件，先明确兼容影响并补测试，不能作为“修类型错误”静默加入。
- [ ] 迁移串行队列及消息协议；成功/失败响应通过 `ok` 收窄，异常值按 `unknown` 处理，保留现有用户可见错误提示及异步 `return true` 语义。
- [ ] 更新 Vite 的后台输入为 `src/background.ts`，输出名称保持 `background.js`；验证单元测试、类型检查、构建和现有多页面 E2E。

## Task 4: 迁移 React 界面和全部测试源码

**Files:** `src/App.tsx`、`src/main.tsx`、`src/components/{Dialog,Editors,Settings,Transfer}.tsx`、`index.html`、所有 `tests/*.ts`、`tests/browser/extension.spec.ts`。

**Interfaces:** 组件 `act` 统一为 `(operation: RepositoryOperation) => Promise<AppState>`；组件 Props 显式声明；`AppState | null` 表示初始化；modal、confirm、导入预览使用实际状态分支类型，保持现有交互。

- [ ] 逐组件迁移 Props、React 事件、DOM ref、异步返回值；设置键使用已知 key 联合类型，避免从任意字符串索引配置。
- [ ] 表单通过 `FormData.get` 后检查字符串；处理 DOM 节点可能不存在、拖拽数据格式、文件选择为空和 `catch unknown`，不依靠批量非空断言压掉错误。
- [ ] 保留编辑冲突后的草稿、额外标签、未知优先级显示、日期跨午夜刷新和只接受最后一次文件读取结果的逻辑。
- [ ] 将 fixture、Node 测试及 Playwright 测试迁移为 `.ts`，更新所有引用及测试发现命令。非法输入测试在调用边界使用局部、有说明的类型绕过，继续实际验证运行时拒绝行为，不能删除负面测试来满足编译器。
- [ ] 核对现有浏览器用例；未覆盖的新文件读取竞态/冲突草稿场景补充稳定的合成测试。运行 `npm test`、`npm run typecheck`、`npm run build`、`npm run test:e2e`，检查 UI 没有变化。

## Task 5: 收口配置、CI、文档与验收

**Files:** `vite.config.ts`、`playwright.config.ts`、`package.json`、两份 tsconfig、`tests/package.test.ts`、`README.md` / `README.en.md`、`CONTRIBUTING.md`、`AGENTS.md`、`docs/releasing.md`、`CHANGELOG.md`；新建 `docs/verification-typescript-migration.md`。按实际需要修改 `.github/workflows/ci.yml` / `release.yml`。

**Interfaces:** `npm run typecheck`、`npm run check`、`npm run build` 和 `npm run package` 成为完整检查/构建入口；现有安装 ZIP 与校验和格式保持一致。

- [ ] 迁移 Vite/Playwright 配置并检查类型配置覆盖范围；移除临时 JS 兼容设置，确保生产源码、配置和测试都被检查。
- [ ] 在打包测试加入意外 `.ts` 文件被拒绝的断言，保留原白名单和校验和测试；类型检查不产生 `.js`/`.map` 等副产物到源码目录或 dist。
- [ ] 更新中英文开发说明、维护指引、源码路径和 typecheck 命令；CHANGELOG 将迁移记录为 Unreleased。功能页仍描述已发布能力，TS 迁移不宣传为用户新功能，历史审计/验收记录保持原状。
- [ ] 检查 CI/Release 已通过 `npm run check` 和 `npm run package` 执行新增检查；确认 Node 22.12.0 最低支持版本与 CI 使用的 Node 22 版本都能执行新命令。
- [ ] 运行 `npm run format`、`npm run check`、`npm run package`；检查 dist/ZIP 的 HTML、service worker 引用、文件清单、许可证和 SHA-256。
- [ ] 用隔离 Chromium、合成旧状态验证升级读取、编辑保存、导入导出、恢复、多标签页冲突；刷新 UI 截图供评审，只有实际界面变化才替换公开截图。
- [ ] 将实际命令、结果、提交标识及未测边界写入迁移验收记录；不得提前记为通过。提交前检查差异中没有真实备份、浏览器配置或其他私密数据。

## 完成标准与回退

完成必须同时满足：目标源码/测试/配置已迁移、严格类型检查通过、既有回归用例保留且通过、扩展可加载、打包与校验和通过、旧数据和备份兼容、双语维护说明已更新。

建议按上述五个任务形成可审查的提交，在同一迁移分支完成后整体合并；每步保留测试记录。由于不改变 schema 或持久化格式，代码可回退到迁移前版本；验证回退使用合成状态，不操作用户日常 Chrome 数据。发布版本号及 Release 不属于本次规划工作。

## 技术依据

- [Vite TypeScript 支持](https://vite.dev/guide/features.html#typescript)：Vite 转译不执行类型检查，需要独立 `tsc --noEmit`。
- [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html)：严格模式覆盖相关类型检查选项。
- [Node.js TypeScript 支持](https://nodejs.org/api/typescript.html)：说明 tsx 的 `node --import=tsx` 用法和内置类型擦除的版本差异。

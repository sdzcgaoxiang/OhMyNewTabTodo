# 外部文件接口验收记录 / External file interface verification

日期：2026-11-09。状态：实现已加入工作区，真实系统文件选择器与浏览器重启后的授权恢复尚待人工验收；未发布版本。

- `npm run check`：51 项 Node 测试和 38 项 Playwright 浏览器测试通过；之后仅改进不支持文件的提示文案。
- 文案修改后运行 `npm run typecheck`、`npm run build` 和 4 项外部文件相关 Playwright 测试，均通过。
- 测试覆盖合成数据投影、任务筛选、文件写入失败、已有其他实例快照取消接管、普通文件和未来版本文件拒绝覆盖、页面数据保存后刷新、停止导出。
- 浏览器测试使用隔离 Chromium profile；用 Origin Private File System 的合成句柄替代系统文件选择器，不能证明操作系统文件选择、外部进程读取真实文件、浏览器重启后的授权恢复或断电持久性。
- 先前 Playwright 系统保存选择器探测被自动取消；不能据此判断实际平台不支持。随后经独立审阅与 File System Access 规范核对，发现保存选择器可能在返回前清空已有文件，改用打开选择器；需要用户事先创建空白 JSON 文件。
- 独立审阅指出的文件提前清空、异实例覆盖、持续编辑无限推迟、非接口文件覆盖及未来版本覆盖风险已处理。并行执行 Playwright 时曾发生测试产物目录冲突，已改为串行重跑。
- Skill 使用官方 `quick_validate.py` 校验通过；PyYAML 安装在临时目录。截图为隔离浏览器和合成数据：[English](images/external-file-en.png) / [中文](images/external-file-zh.png)。
- 尚未验证：真实系统文件选择与权限提示、浏览器完全退出后由外部进程读取实际磁盘文件、重新启动后的持久授权、多浏览器配置竞争与真实断电行为。不要将模拟句柄测试表述为这些验证通过。

English summary: Unit and browser checks passed; browser tests use synthetic OPFS file handles. Native chooser, external disk reads after Chrome exits, and permission persistence after restart remain unverified. No release or publication was performed.

## 2026-11-10 真实文件与重启复验

- 使用临时 Chrome for Testing 应用副本（Chromium 156）、隔离浏览器配置和临时合成空白 JSON 文件；没有使用用户的正式浏览器配置或真实待办。
- 通过实际 macOS 文件选择器选择文件，批准该合成文件的读取和写入。插件显示启用并成功输出；创建合成看板和任务后，独立 Node CLI 从真实磁盘文件读到该任务，修订号为 2。
- 完全退出隔离浏览器，确认对应测试浏览器进程已结束；独立 CLI 仍可读取磁盘上的任务快照。
- 使用同一隔离配置重新启动。首次打开后插件保留文件连接，但写入权限未延续并显示需要重新授权。点击重新连接，先允许读取；再次点击并允许写入后，导出成功恢复。该环境中需要两次点击，授权没有自动恢复。
- 恢复后将合成任务标记完成，实际 JSON 文件修订号变为 3，CLI 能按 completed 筛选读取；再次完全退出隔离浏览器后仍能读取完成状态。
- 新增 `tests/browser/external-restart.spec.ts`：隔离 Chromium 完全退出和重启后，验证 OPFS 合成句柄、来源 ID 和后续快照更新。它与上面的真实系统文件验收分别记录。
- `npm run check`（包含新增重启测试）：51 项 Node 测试、39 项 Playwright 测试通过。
- 限制：只在本机 macOS / Chromium 156 的隔离测试环境检查；Windows、Linux、其他 Chrome 版本、持续授权选项、多浏览器配置竞争及断电持久性未验证。当前重连提示较笼统，需要两次操作才能恢复写权限。
- 两次 `cua.getState()` 超时；直接按应用路径获取窗口可用。观察只能证明全量界面清单调用未及时返回，不能确定内部原因。同名 Chrome 测试进程容易被选错，因此使用临时副本和单独应用标识定位隔离窗口。

English summary: On macOS with isolated Chromium 156, a real native picker and file were used; CLI reads persisted after full browser exit. On restart, the prior grant was not retained; separate read and write grants restored export, and a task update was persisted. Other platforms and persistent-grant modes remain unverified.

## 2026-11-10 交付前复审

- 复审发现 CLI 接受数组形式的 boards/cards 并错误返回空列表。新增失败测试后，CLI 增加对象及看板、任务基本字段校验，合成损坏快照现在返回非零状态并保持标准输出为空。
- 根据 macOS 实测，在权限错误提示及中英文使用说明中说明浏览器可能分别请求读取和写入，需要再次点击恢复授权。新增浏览器回归测试。
- CLI 和 Skill 通过仓库源码提供；扩展 ZIP 不包含它们，安装入口和文件路径见使用说明。

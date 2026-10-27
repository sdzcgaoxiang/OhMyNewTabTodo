# 贡献指南

欢迎修复问题、改进兼容性与文档。新功能先通过 Issue 说明使用场景、预期行为、数据兼容和维护成本；小修复可以直接发 PR。

## 工作流程

1. 在分支上工作。涉及行为变更时先更新或新增 `docs/superpowers/specs/` 中的规格；多步骤工作在 `docs/superpowers/plans/` 记录计划。
2. 使用合成数据写能复现问题的失败测试，运行确认失败原因，再实现最小改动。领域逻辑放 `model.js`，文件兼容放 `transfer.js`，持久化放 `repository.js`。
3. 保持后台单写入口。页面发送操作，不写回整份过期状态；破坏性操作及导入必须检测预览 revision。
4. 使用 `npm run format` 统一代码格式，运行 `npm run check` 和 `npm run package`；UI 变化同时检查实际扩展截图和键盘操作。
5. 更新 README / CHANGELOG / 隐私说明等受影响文档，PR 描述写清问题、结果与验证。

## 数据与兼容

- 不复制 NewTabTodo 的闭源实现、图标或素材。兼容格式是协议要求；独立实现并不授予对原版代码的分发权。
- 不提交 `reference/`、Chrome 配置、凭据或真实备份，即使已经加到 `.gitignore` 也应检查提交内容。
- 保留导入对象中未识别的业务字段，不做静默截断或猜测性删除。新增拒绝条件需要兼容测试和说明。
- schema / 备份格式升级必须包含旧版本迁移测试；未来版本必须明确拒绝，不能自动清空数据。
- 测试应验证可观察结果：失败不改数据、重启后数据仍在、合并幂等、冲突不会丢草稿。不仅断言内部函数调用。

## 发布

同步更新 `package.json` / lockfile、`src/model.js`、`public/manifest.json` 和界面版本，补充 CHANGELOG；先运行全套检查并审查公开内容。推送 `v0.1.0` 这样的版本 tag 后，GitHub Actions 会重新检查版本、构建、浏览器验收和打包，成功后发布 GitHub Release。第一次使用需确保仓库允许 Actions；发布工作流仅给发布作业 `contents: write`。

目前只发布手动加载的扩展包。Chrome Web Store 上架、自动更新、跨设备同步与服务器运维都需要单独设计。依赖锁定在 lockfile，更新时使用独立 PR 并跑全套检查。

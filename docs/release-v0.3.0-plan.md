# v0.3.0 release plan / 发布计划

Scope / 范围：发布已合并的中英文首页界面；首次使用默认为英文，首页可切换语言。保护 `main`，要求 PR 和 `check` 通过。发布工作流应只构建一次，浏览器验收使用的 `dist/` 直接打成 ZIP，再把同一 ZIP 传给发布作业。暂不增加发布审批门槛或产物证明。

Acceptance / 验收：

1. `main` 规则阻止直接推送、强推和删除，要求 PR 与最新 `check` 通过。
2. `npm run check` 构建并验证扩展；`npm run package:dist` 不重建 `dist/`，生成版本匹配的 ZIP 和 SHA-256。
3. Release 验证作业上传 ZIP 与校验文件，发布作业下载并校验相同文件后创建 GitHub Release。
4. `v0.3.0` 的版本号、双语文档、验收记录、Release 说明和下载附件一致。

Steps / 步骤：更新工作流和版本说明；完成本地完整检查和产物核对；通过 PR 的 CI 并合并；推送 `v0.3.0` tag；核对 Release 附件、校验和和安装内容。

# 版本发布与文档更新清单

[English release checklist](#english-release-checklist) · [贡献指南](../CONTRIBUTING.md) · [Repository Guidelines](../AGENTS.md)

本清单适用于每个正式版、预发布版和补丁版。发布负责人在版本 PR 中记录已更新文件；不适用的条件项注明原因。**只改文档不需要升级扩展版本或重发安装包**，记入 CHANGELOG 的 Unreleased，功能页仍标记实际已发布版本。

## 每个版本必须检查并刷新

| 文档 / 入口 | 必须检查、更新的内容 |
| --- | --- |
| `CHANGELOG.md` | 中英文版本摘要、版本号、日期、增加/修复/变化、迁移影响、已知限制。发布时把本版条目从 Unreleased 移到对应版本；不把计划当作已发布。 |
| `README.md` + `README.en.md` | 当前版本、安装包名称/链接、主要卖点、安装与更新步骤、平台与界面语言、同步和容量边界、文档入口。 |
| `docs/features.md` + `docs/features.en.md` | 适用版本、核对日期、已实现特性、对比表、迁移场景及限制。没有用户可见变化时明确记录“本版无新增用户特性”；原版对比基线仍保留已审计版本。 |
| 新建 `docs/verification-vX.Y.Z.md` | 对应提交、真实执行的命令与结果、兼容/回归证据、审查结论、未覆盖边界、CI 链接、产物及校验结果。保留之前版本的记录，README 指向当前记录。 |
| GitHub Release | 中英文当版摘要、重要迁移说明、已知限制、正确 tag、ZIP 和 SHA-256。当前工作流从整个 CHANGELOG 生成说明，发布负责人须检查并整理本版摘要，避免把 Unreleased 内容宣传为已发布。 |

中英文 README 和特性说明必须在同一个 PR 内保持事实一致：版本、功能状态、限制、数字和下载目标一致；不能只翻译卖点而遗漏限制。新验收记录至少提供中英文结果摘要，详细技术日志可保留原语言。

## 按变化更新，未变化也要确认

| 触发变化 | 需要更新 |
| --- | --- |
| 权限、网络请求、数据收集、备份内容或删除行为 | `PRIVACY.md`、对应 README 与特性说明；有英文隐私文件后同步维护。 |
| 数据模型、导入格式、恢复规则或迁移方式 | 新/相关规格与计划、迁移说明、兼容样例和测试；新增调研证据，不篡改原版历史审计结论。 |
| 开发命令、目录、测试、贡献或发布流程 | `CONTRIBUTING.md`、`AGENTS.md`、本清单、两种 README 及相关 `.github/` 模板/工作流。 |
| 界面或操作步骤 | `docs/images/` 中受影响截图、双语说明和替代文本；只用合成数据。界面语言有变化时同步说明。 |
| 依赖、许可或分发方式 | `LICENSE`（若许可变化）、`public/LICENSE.txt`、lockfile、构建与安装说明。 |

## 发布前后操作

1. 同步 `package.json` / lockfile、`src/model.js`、`public/manifest.json` 和界面中的版本；查找残留旧版本引用，区分历史证据与当前说明，禁止全仓库盲目替换。
2. 运行 `npm run check` 和 `npm run package`；检查 ZIP 文件清单、许可证、校验和、双语事实、相对链接和截图。真实执行结果写入本版验收记录。
3. 更新当前规格/计划进度；不要覆盖已完成版本的验收结果，也不要把历史审计日期改成今天。
4. 推送版本提交和对应 tag，检查 Actions。确认 Release 的附件、版本、双语说明和校验和；再记录实际发布结果。失败则查明原因，不能只把文档改成“已通过”。

文档检查是发布负责人的评审要求；现有 CI 检查代码、测试和打包，**不会自动判断翻译或产品宣传是否准确**。

## English release checklist

Apply this checklist to every stable, prerelease, and patch release. The release owner records updated files in the version PR and explains non-applicable conditional items. **Documentation-only changes do not require a product version bump or a new archive**: record them under Unreleased and keep feature pages tied to the actual released version.

### Review and refresh for every version

| Document / entry point | Required review |
| --- | --- |
| `CHANGELOG.md` | Chinese and English release summaries, version/date, additions/fixes/changes, migration impact, and known limits. Move this release's entries out of Unreleased; do not label plans as shipped. |
| `README.md` + `README.en.md` | Current version, archive name/links, key benefits, installation/update steps, platform and UI language, sync/capacity limits, and documentation links. |
| `docs/features.md` + `docs/features.en.md` | Applicable version, review date, available features, comparison, migration examples, and limits. If unchanged, state that no new user-facing features were added. Keep the original-product baseline at the audited version. |
| New `docs/verification-vX.Y.Z.md` | Commit, actual commands/results, compatibility/regression evidence, review outcome, untested boundaries, CI links, artifacts, and checksum verification. Retain older records and link the current one from both READMEs. |
| GitHub Release | Chinese and English summaries for this version, migration notes, limits, correct tag, ZIP, and SHA-256. The current workflow reads the whole changelog; the release owner must review and curate the current-version summary so Unreleased items are not presented as shipped. |

Update paired README and feature pages in the same PR. Versions, feature status, limits, numbers, and download targets must agree; translate limitations as well as benefits. New verification records need at least bilingual outcome summaries; detailed technical logs may remain in their original language.

### Conditional updates

- Permissions, network use, collection, backup contents, or deletion: update `PRIVACY.md` and affected README/feature pages; maintain any English privacy counterpart once introduced.
- Data model, file formats, recovery, or migration: update relevant/new specifications, plans, migration guidance, synthetic fixtures, and tests. Add evidence without rewriting historical audits.
- Commands, directories, tests, contribution or release processes: update `CONTRIBUTING.md`, `AGENTS.md`, this checklist, both READMEs, and relevant `.github/` templates/workflows.
- UI or instructions: refresh affected synthetic screenshots in `docs/images/`, both language descriptions, alt text, and UI-language notices.
- Dependencies, licensing, or distribution: review `LICENSE`, bundled `public/LICENSE.txt`, lockfile, build instructions, and installation guidance.

### Before and after publishing

1. Align package/lockfile, model, manifest, and displayed versions. Search old-version references, distinguishing current instructions from historical evidence; never replace versions globally without review.
2. Run `npm run check` and `npm run package`. Inspect archive contents, licenses, checksum, bilingual facts, relative links, and screenshots; record actual outcomes.
3. Update current specification/plan status. Preserve previous verification results and original audit dates.
4. Push the version commit and matching tag; inspect Actions and the published release's assets, bilingual notes, and checksums. Record publication only after verification. Investigate failures instead of changing documentation to claim success.

This is a release-owner review requirement. Existing CI checks code, tests, and packaging; **it does not automatically verify translation accuracy or product claims**.

# v0.4.0 发布验收 / Release verification

日期 / Date: 2026-11-03

## 范围 / Scope

新增卡片表单显示本地创建时间，默认打开时的当前时间，可手动调整并以现有 ISO 时间戳保存。编辑、复制、旧数据及备份格式保留既有规则。/ The new-card form defaults to the current local creation time and accepts a chosen time. The saved value uses the existing ISO timestamp field; edit, copy, legacy data, and backup behavior are unchanged.

## 本地核对 / Local checks

| Check / 检查 | Result / 结果 |
| --- | --- |
| `npm run check` | 通过：格式检查、46 项单元测试、TypeScript 与构建、33 项 Chromium 浏览器测试 / Passed: formatting, 46 unit tests, TypeScript/build, and 33 Chromium browser tests. |
| `npm run package:dist` | 通过：从验收后的 `dist/` 打包 9 个文件 / Passed: packaged nine files from the tested `dist/`. |
| ZIP 内容与 SHA-256 / Archive contents and checksum | `shasum -a 256 -c SHA256SUMS.txt` 通过；9 个白名单文件包含 manifest、两种语言目录和许可证，manifest 版本为 `0.4.0`。本地 ZIP SHA-256：`7ea9a7c227218cf0d2ba216f0f51f163df957c563267c02118985f41d3de86ac`。/ Checksum passed; the nine allowlisted files include the manifest, both locale catalogs, and license. |
| 合成界面截图 / Synthetic UI screenshot | `docs/images/card-created-at.png` 展示中文新增表单和预填创建时间，内容仅为合成数据。/ The screenshot shows the Chinese new-card form and its default creation time, with synthetic data only. |

## 发布核对 / Publication checks

版本 PR、合并提交、`v0.4.0` tag、发布工作流、GitHub Release 附件与下载后校验将在实际完成后记录，不预先宣称通过。/ The version PR, merge commit, tag, release workflow, assets, and downloaded checksum will be recorded after they have actually completed.

## 边界 / Limits

浏览器验收使用 Playwright 附带的独立 Chromium，不访问日常 Chrome 配置；尚未逐版验证所有 Chrome 版本，也未上架 Chrome Web Store。/ Browser tests use isolated Playwright Chromium profiles, not the everyday Chrome profile. This is not a test of every supported Chrome version or a Chrome Web Store publication.

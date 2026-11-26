# Local external interface / 本地外部接口

This feature is under development and is not part of the 0.4.0 release. 本功能仍在开发验收，不属于已发布的 0.4.0。

In Settings → Import / Export, create an empty JSON file, then select it under External tool access. When the page is open, the extension updates the file after persisted changes. If Chrome has revoked file permission, use Reconnect. The browser may request read and write permissions separately; if the permission warning remains, select Reconnect again. Closing the page or browser can leave an older snapshot; reopening the page refreshes it when permission remains valid. The file contains plaintext task details. Stopping export or uninstalling the extension does not remove the file. It is a read-only projection, not a backup. Do not edit it expecting task changes.

在“设置 → 导入 / 导出 → 外部工具读取”中选择事先创建的空白 JSON 文件。待办页面打开时，插件在数据保存后更新文件；权限失效时点击恢复授权；浏览器可能分两次请求读取和写入权限，如提示仍在，请再次点击恢复授权。页面或浏览器关闭时，文件可能是旧快照；重新打开且授权有效时会刷新。文件包含明文任务，停止导出或卸载插件不会删除文件。它不是完整备份，修改文件不会修改待办。

The snapshot uses `format: ohmynewtabtodo.readonly`, `formatVersion: 1`, `source.instanceId`, `source.revision`, `exportedAt`, and `data` containing `boardOrder`, `boards`, and `cards`. Dates retain local calendar semantics. The timestamp is the last successful export, not proof that the browser is running or that the snapshot is current.

## CLI

Node.js 22.12+ is required. From a project checkout, substitute the actual path selected in the file picker:

```sh
node cli/omntt.mjs configure --file /path/to/todos.json
node cli/omntt.mjs boards --json
node cli/omntt.mjs tasks --status pending --json
node cli/omntt.mjs tasks --due today --json
node cli/omntt.mjs task CARD_ID --json
node cli/omntt.mjs status --json
```

`--file` overrides `OMNTT_FILE` and the configured file. `npm link` can make the `omntt` command available locally. JSON goes to stdout and errors go to stderr with a nonzero exit status. Only use this CLI with files you are authorized to read.

Copy `skills/omntt` to your Codex skills directory to install the optional companion skill. The skill and CLI require access to the local snapshot; a remote isolated AI environment cannot access it automatically. No MCP server is provided.

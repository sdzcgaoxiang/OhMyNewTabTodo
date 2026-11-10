import React, { useEffect, useState } from 'react';
import {
  externalStatus,
  observeExternal,
  reconnectExternal,
  refreshExternal,
  selectExternal,
  stopExternal,
  supported,
} from '../external-file.ts';
import { useLanguage } from '../i18n.tsx';

type Status = Awaited<ReturnType<typeof externalStatus>>;
export function ExternalFile() {
  const language = useLanguage();
  const zh = language === 'zh-CN';
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supported()) return;
    const update = () => {
      void externalStatus()
        .then(setStatus)
        .catch(() => setError('unavailable'));
    };
    const off = observeExternal(update);
    update();
    return off;
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h3>{zh ? '外部工具读取' : 'External tool access'}</h3>
      <p>
        {zh
          ? '请先创建空白 JSON 文件，再选择它供本机工具读取。文件包含明文任务；关闭浏览器后保留最后一次导出。'
          : 'Create an empty JSON file first, then select it for local tools. It contains plaintext tasks and remains available after the browser closes.'}
      </p>
      {!supported() ? (
        <p>
          {zh ? '此功能在当前环境不可用。' : 'This feature is unavailable in this environment.'}
        </p>
      ) : (
        <>
          <p>
            {status?.enabled ? (zh ? '已开启' : 'Enabled') : zh ? '已关闭' : 'Disabled'}
            {status?.handle?.name ? ` · ${status.handle.name}` : ''}
            {status?.exportedAt ? ` · ${status.exportedAt} · #${status.revision}` : ''}
          </p>
          {(error || status?.error) && (
            <p role="alert">
              {(error || status?.error) === 'unrecognized-file'
                ? zh
                  ? '请选择空白 JSON 文件或受支持的快照；原文件未修改。'
                  : 'Choose an empty JSON file or supported snapshot; the original file was not modified.'
                : (error || status?.error) === 'permission'
                  ? zh
                    ? '请恢复授权；浏览器可能分别要求读取和写入权限。如仍提示权限错误，请再次点击恢复授权。'
                    : 'Reconnect to grant access. Your browser may ask separately for read and write permissions; reconnect again if permission is still required.'
                  : zh
                    ? '文件更新失败或需要重新授权，请重试。'
                    : 'File update failed or needs permission. Please retry.'}{' '}
              {error || status?.error}
            </p>
          )}
          <div className="export-buttons">
            <button disabled={busy} onClick={() => void run(selectExternal)}>
              {zh ? '选择数据文件' : 'Choose data file'}
            </button>
            {status && (
              <button disabled={busy} onClick={() => void run(() => reconnectExternal(status))}>
                {zh ? '恢复授权并连接' : 'Reconnect and grant access'}
              </button>
            )}
            {status?.enabled && (
              <>
                <button disabled={busy} onClick={() => void run(refreshExternal)}>
                  {zh ? '立即刷新' : 'Refresh now'}
                </button>
                <button disabled={busy} onClick={() => void run(stopExternal)}>
                  {zh ? '停止自动导出' : 'Stop exporting'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

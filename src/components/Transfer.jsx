import React, { useEffect, useRef, useState } from 'react';
import { parseImport, exportFull, exportLegacy, MAX_IMPORT_BYTES } from '../transfer.ts';
import { readState } from '../client.ts';
import { Confirm } from './Dialog.jsx';
function download(value, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Transfer({ state, act }) {
  const loadRequest = useRef(0);
  useEffect(
    () => () => {
      loadRequest.current++;
    },
    [],
  );
  const [preview, setPreview] = useState(null),
    [mode, setMode] = useState('merge'),
    [recoverBoards, setRecoverBoards] = useState(false),
    [recoverCards, setRecoverCards] = useState(false),
    [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(null);
  async function load(event) {
    const request = ++loadRequest.current;
    const file = event.target.files?.[0];
    event.target.value = '';
    setPreview(null);
    setError('');
    setMessage('');
    setAgreed(false);
    setRecoverBoards(false);
    setRecoverCards(false);
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('文件超过 5 MiB，请减少内容后重试');
      const text = await file.text();
      if (request !== loadRequest.current) return;
      const parsed = parseImport(text),
        revision = (await readState()).revision;
      if (request === loadRequest.current) setPreview({ text, parsed, revision, name: file.name });
    } catch (e) {
      if (request === loadRequest.current) setError(e.message);
    }
  }
  async function commit() {
    if (!preview || (mode === 'replace' && !agreed)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await act({
        type: 'import',
        text: preview.text,
        mode,
        recoverBoards,
        recoverCards,
        expectedRevision: preview.revision,
      });
      setPreview(null);
      setMessage('导入已保存');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(full) {
    try {
      const current = await readState();
      download(
        full ? exportFull(current) : exportLegacy(current),
        full ? 'OhMyNewTabTodo_Backup' : 'NewTabTodo_Export_0.2.0',
      );
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="transfer">
      <h3>让数据随时可以带走</h3>
      <p className="muted">文件只在本机处理。兼容 NewTabTodo 导出文件，导入前先检查内容。</p>
      <div className="export-buttons">
        <button className="primary" onClick={() => save(true)}>
          导出完整备份
        </button>
        <button onClick={() => save(false)}>导出原版格式</button>
      </div>
      <p className="hint">
        完整备份包含设置和主题；原版格式仅包含看板、卡片与常用链接，不保证旧插件自身的导入缺陷已解决。
      </p>
      <div className="file-box">
        <label>
          选择 JSON 文件
          <input type="file" accept=".json,application/json" disabled={busy} onChange={load} />
        </label>
        <span className="hint">最大 5 MiB · 预览不会修改当前数据</span>
      </div>
      {preview && (
        <div className="import-preview">
          <h4>导入预览</h4>
          <p className="filename">{preview.name}</p>
          <div className="preview-counts">
            <strong>
              {preview.parsed.stats.boards}
              <small>看板</small>
            </strong>
            <strong>
              {preview.parsed.stats.cards}
              <small>卡片</small>
            </strong>
            <strong>
              {preview.parsed.stats.bookmarks}
              <small>链接</small>
            </strong>
          </div>
          {preview.parsed.warnings.map((w, i) => (
            <p className="warning" key={i}>
              {w}
            </p>
          ))}
          {!!preview.parsed.stats.orphanBoardIds.length && (
            <>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={recoverBoards}
                  onChange={(e) => setRecoverBoards(e.target.checked)}
                />
                恢复未列入顺序的看板
              </label>
              <p className="hint">
                {preview.parsed.stats.orphanBoardIds
                  .map((id) => preview.parsed.data.boards[id].title || '未命名')
                  .join('、')}
                。不勾选也会保留数据；原有隐藏状态不变。
              </p>
            </>
          )}
          {!!preview.parsed.stats.orphanCardIds.length && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={recoverCards}
                onChange={(e) => setRecoverCards(e.target.checked)}
              />
              将未关联的卡片恢复到新看板
            </label>
          )}
          <label>
            导入方式
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setAgreed(false);
              }}
            >
              <option value="merge">合并：相同内容跳过，冲突时停止</option>
              <option value="replace">替换：以文件为准，先保存恢复点</option>
              <option value="copy">作为副本：保留当前内容并新增</option>
            </select>
          </label>
          {mode === 'replace' && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              我确认替换当前数据
            </label>
          )}
          {state.revision !== preview.revision && (
            <p className="warning">预览后数据发生了变化，请重新选择文件。</p>
          )}
          <button
            className="primary"
            disabled={
              busy || state.revision !== preview.revision || (mode === 'replace' && !agreed)
            }
            onClick={commit}
          >
            {busy ? '正在保存…' : '确认导入'}
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <hr />
      <h3>本机恢复点</h3>
      <p className="hint">
        保留最近 3 次导入、恢复或清空前的数据。它们与扩展保存在同一台电脑，不能替代导出的备份文件。
      </p>
      {!state.backups.length ? (
        <p className="empty-note">还没有恢复点</p>
      ) : (
        state.backups.map((backup) => (
          <div className="backup-row" key={backup.id}>
            <div>
              <strong>{backup.label}</strong>
              <small>
                {new Date(backup.createdAt).toLocaleString()} ·{' '}
                {Object.keys(backup.state.data.cards).length} 张卡片
              </small>
            </div>
            <button
              onClick={() =>
                setConfirm({
                  title: '恢复备份',
                  text: '将替换当前数据，并保留恢复前的数据。',
                  action: '确认恢复',
                  onConfirm: () =>
                    act({ type: 'restore', id: backup.id, expectedRevision: state.revision }),
                })
              }
            >
              恢复此备份
            </button>
          </div>
        ))
      )}
      <div className="danger-zone">
        <p>清空看板、卡片和常用链接，保留设置，并建立恢复点。</p>
        <button
          className="danger-outline"
          onClick={() =>
            setConfirm({
              title: '清空数据',
              text: '确认清空当前看板、卡片和常用链接？',
              action: '确认清空',
              onConfirm: () => act({ type: 'clear', expectedRevision: state.revision }),
            })
          }
        >
          清空当前数据
        </button>
      </div>
      {confirm && <Confirm {...confirm} onClose={() => setConfirm(null)} />}
    </section>
  );
}

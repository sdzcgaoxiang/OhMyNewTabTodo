import React, { useState } from 'react';
import { Dialog } from './Dialog.jsx';
import { Transfer } from './Transfer.jsx';
import { safeUrl } from '../model.js';
const sections = {
  常规: [
    ['playSoundEffects', '完成提示音', '完成卡片时播放轻提示音'],
    ['allowHidingBoard', '允许隐藏看板', '隐藏的看板可随时重新显示'],
  ],
  卡片: [
    ['hideCardDescription', '隐藏描述', '只在详情中显示卡片描述'],
    ['linkFormatting', '简化链接显示', '省略网址中的协议前缀'],
    ['dimCompletedCards', '已完成卡片变暗', '让未完成的事项更突出'],
    ['hideCompletedCards', '隐藏已完成卡片', '完成项移至底部，可临时显示'],
    ['showCompactCards', '紧凑模式', '显示标题，点击查看详情'],
  ],
  搜索: [
    ['hideGoogleSearch', '隐藏 Google', ''],
    ['hideBingSearch', '隐藏 Bing', ''],
    ['hideDuckDuckGoSearch', '隐藏 DuckDuckGo', ''],
    ['hideYoutubeSearch', '隐藏 YouTube', ''],
  ],
  时钟: [
    ['showClock', '显示时钟', '在新标签页显示日期和时间'],
    ['twentyFourHours', '24 小时制', ''],
    ['pinClock', '固定时钟', '关闭后在打开页面数秒后收起'],
  ],
};
export function Settings({ state, act, onClose }) {
  const [section, setSection] = useState('常规'),
    [error, setError] = useState('');
  return (
    <Dialog title="设置" drawer closeLabel="关闭设置" onClose={onClose}>
      <nav className="settings-tabs" aria-label="设置分类">
        {[...Object.keys(sections), '导入 / 导出', '关于'].map((s) => (
          <button key={s} className={section === s ? 'selected' : ''} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {sections[section]?.map(([key, label, description]) => (
        <label className="option-row" key={key}>
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <input
            type="checkbox"
            checked={!!state.options[key]}
            disabled={['pinClock', 'twentyFourHours'].includes(key) && !state.options.showClock}
            onChange={async (e) => {
              try {
                await act({ type: 'options.patch', patch: { [key]: e.target.checked } });
                setError('');
              } catch (e) {
                setError(e.message);
              }
            }}
          />
        </label>
      ))}
      {section === '导入 / 导出' && <Transfer state={state} act={act} />}
      {section === '关于' && (
        <section className="about">
          <div className="brand-mark">✓</div>
          <h3>OhMyNewTabTodo</h3>
          <p>0.1.0 · 本地优先的开源新标签页待办</p>
          <p>熟悉的看板交互，可带走的数据。独立实现，与 NewTabTodo 原作者无关联。</p>
          <p className="muted">无账号、无统计上传、无跨设备自动同步。卸载前请导出完整备份。</p>
          <a
            href="https://github.com/sdzcgaoxiang/OhMyNewTabTodo"
            target="_blank"
            rel="noopener noreferrer"
          >
            源码、更新与问题反馈 ↗
          </a>
        </section>
      )}
    </Dialog>
  );
}
export function Bookmarks({ state, act, onClose }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title="常用链接" drawer closeLabel="关闭常用链接" onClose={onClose}>
      <p className="muted">把经常访问的地方，放在触手可及的位置。</p>
      <div className="bookmark-list">
        {state.bookmarks.length ? (
          state.bookmarks.map((b) => (
            <div key={b.id} className="bookmark-row">
              {safeUrl(b.url) ? (
                <a href={safeUrl(b.url)} target="_blank" rel="noopener noreferrer">
                  {b.name}
                  <small>{b.url}</small>
                </a>
              ) : (
                <span>
                  {b.name}
                  <small>无效地址，已保留原数据</small>
                </span>
              )}
              <button
                aria-label={`删除链接 ${b.name}`}
                onClick={async () => {
                  try {
                    await act({ type: 'bookmark.delete', id: b.id });
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="empty-note">添加你的第一个常用链接</p>
        )}
      </div>
      <hr />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            fields = Object.fromEntries(new FormData(form));
          setBusy(true);
          try {
            await act({ type: 'bookmark.add', bookmark: { name: fields.name, url: fields.url } });
            form.reset();
            setError('');
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          链接名称
          <input name="name" required placeholder="例如：GitHub" />
        </label>
        <label>
          网址
          <input name="url" required type="url" placeholder="https://" />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          添加链接
        </button>
      </form>
    </Dialog>
  );
}

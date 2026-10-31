import React, { useState } from 'react';
import { Dialog } from './Dialog.tsx';
import { Transfer } from './Transfer.tsx';
import { DEFAULT_OPTIONS, safeUrl } from '../model.ts';
import type { AppState } from '../types.ts';
import type { Act } from './ui.ts';
import { errorMessage } from './ui.ts';
import { issue } from '../issues.ts';
import { useT } from '../i18n.tsx';
import type { TranslationKey } from '../i18n.ts';
type OptionKey = keyof typeof DEFAULT_OPTIONS;
const sections: Record<
  string,
  ReadonlyArray<readonly [OptionKey, TranslationKey, TranslationKey | '']>
> = {
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
export function Settings({
  state,
  act,
  onClose,
}: {
  state: AppState;
  act: Act;
  onClose: () => void;
}) {
  const t = useT();
  const [section, setSection] = useState('常规'),
    [error, setError] = useState<unknown>(null);
  return (
    <Dialog title={t('设置')} drawer closeLabel={t('关闭设置')} onClose={onClose}>
      <nav className="settings-tabs" aria-label={t('设置分类')}>
        {[...Object.keys(sections), '导入 / 导出', '关于'].map((s) => (
          <button key={s} className={section === s ? 'selected' : ''} onClick={() => setSection(s)}>
            {t(s as TranslationKey)}
          </button>
        ))}
      </nav>
      {error != null && (
        <p role="alert" className="error">
          {errorMessage(error, state.language)}
        </p>
      )}
      {sections[section]?.map(([key, label, description]) => (
        <label className="option-row" key={key}>
          <span>
            <strong>{t(label)}</strong>
            <small>{description ? t(description) : null}</small>
          </span>
          <input
            type="checkbox"
            checked={!!state.options[key]}
            disabled={['pinClock', 'twentyFourHours'].includes(key) && !state.options.showClock}
            onChange={async (e) => {
              try {
                await act({ type: 'options.patch', patch: { [key]: e.target.checked } });
                setError(null);
              } catch (e) {
                setError(e);
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
          <p>{t('0.3.0 · 本地优先的开源新标签页待办')}</p>
          <p>{t('熟悉的看板交互，可带走的数据。独立实现，与 NewTabTodo 原作者无关联。')}</p>
          <p className="muted">
            {t('无账号、无统计上传、无跨设备自动同步。卸载前请导出完整备份。')}
          </p>
          <a
            href="https://github.com/sdzcgaoxiang/OhMyNewTabTodo"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('源码、更新与问题反馈 ↗')}
          </a>
        </section>
      )}
    </Dialog>
  );
}
export function Bookmarks({
  state,
  act,
  onClose,
}: {
  state: AppState;
  act: Act;
  onClose: () => void;
}) {
  const t = useT();
  const [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={t('常用链接')} drawer closeLabel={t('关闭常用链接')} onClose={onClose}>
      <p className="muted">{t('把经常访问的地方，放在触手可及的位置。')}</p>
      <div className="bookmark-list">
        {state.bookmarks.length ? (
          state.bookmarks.map((b) => (
            <div key={b.id} className="bookmark-row">
              {safeUrl(b.url) ? (
                <a href={safeUrl(b.url) || undefined} target="_blank" rel="noopener noreferrer">
                  {b.name}
                  <small>{b.url}</small>
                </a>
              ) : (
                <span>
                  {b.name}
                  <small>{t('无效地址，已保留原数据')}</small>
                </span>
              )}
              <button
                aria-label={t('app.deleteLink', { name: b.name })}
                onClick={async () => {
                  try {
                    await act({ type: 'bookmark.delete', id: b.id });
                  } catch (e) {
                    setError(e);
                  }
                }}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="empty-note">{t('添加你的第一个常用链接')}</p>
        )}
      </div>
      <hr />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const name = data.get('name');
          const url = data.get('url');
          if (typeof name !== 'string' || typeof url !== 'string') {
            setError(issue('bookmark.invalidForm', '链接表单无效，请重新填写'));
            return;
          }
          setBusy(true);
          try {
            await act({ type: 'bookmark.add', bookmark: { name, url } });
            form.reset();
            setError(null);
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t('链接名称')}
          <input name="name" required placeholder={t('例如：GitHub')} />
        </label>
        <label>
          {t('网址')}
          <input name="url" required type="url" placeholder="https://" />
        </label>
        {error != null && (
          <p className="error" role="alert">
            {errorMessage(error, state.language)}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {t('添加链接')}
        </button>
      </form>
    </Dialog>
  );
}

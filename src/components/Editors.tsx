import React, { useState } from 'react';
import { Dialog } from './Dialog.tsx';
import { safeUrl, newId } from '../model.ts';
import type { AppState, Board, Card, Label } from '../types.ts';
import type { Act, CardInitial } from './ui.ts';
import { errorMessage } from './ui.ts';
import { useLanguage, useT } from '../i18n.tsx';

export function BoardEditor({
  board,
  act,
  onClose,
}: {
  board?: Board;
  act: Act;
  onClose: () => void;
}) {
  const t = useT();
  const language = useLanguage();
  const [name, setName] = useState(board?.title || ''),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={board ? t('编辑看板') : t('新建看板')} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await act(
              board
                ? { type: 'board.update', id: board.id, patch: { title: name }, expected: board }
                : { type: 'board.add', title: name },
            );
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t('看板名称')}
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('例如：今天、工作、生活')}
          />
        </label>
        {error != null && (
          <p role="alert" className="error">
            {errorMessage(error, language)}
          </p>
        )}
        <footer className="form-actions">
          <button type="button" onClick={onClose}>
            {t('取消')}
          </button>
          <button className="primary" disabled={busy}>
            {t('保存看板')}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function CardEditor({
  initial,
  state,
  act,
  onClose,
}: {
  initial: CardInitial;
  state: AppState;
  act: Act;
  onClose: () => void;
}) {
  const t = useT();
  const language = useLanguage();
  const original = initial.card;
  const [due, setDue] = useState(original?.dueDate || ''),
    [time, setTime] = useState(original?.dueTime || ''),
    [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  const labelText = (type: string) =>
    original?.labels?.find((label) => label.type === type)?.text || '';
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const field = (name: string): string => {
      const value = form.get(name);
      return typeof value === 'string' ? value : '';
    };
    const labels: Label[] = [...(original?.labels || [])];
    for (const type of ['primary', 'secondary']) {
      const index = labels.findIndex((l) => l.type === type),
        old = labels[index];
      if (field(type) === (old?.text || '')) continue;
      if (!field(type).trim()) {
        if (index >= 0) labels.splice(index, 1);
      } else {
        const label = { ...old, id: old?.id || newId('label'), type, text: field(type).trim() };
        if (index >= 0) labels[index] = label;
        else labels.push(label);
      }
    }
    const patch = {
      title: field('title'),
      description: field('description'),
      priority: field('priority'),
      dueDate: due,
      dueTime: due ? time : '',
      labels,
    };
    setBusy(true);
    try {
      await act(
        original
          ? {
              type: 'card.update',
              id: original.id,
              patch,
              boardId: field('boardId'),
              expected: original,
              expectedBoardId: initial.boardId,
            }
          : { type: 'card.add', card: patch, boardId: field('boardId'), index: initial.index },
      );
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={original ? t('编辑卡片') : t('添加卡片')} onClose={onClose}>
      <form onSubmit={save}>
        <label>
          {t('所属看板')}
          <select name="boardId" defaultValue={initial.boardId}>
            {state.data.boardOrder.map((id) => (
              <option key={id} value={id}>
                {state.data.boards[id].title || t('未命名看板')}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('卡片标题')}
          <input
            name="title"
            autoFocus
            required
            defaultValue={original?.title || ''}
            placeholder={t('接下来想完成什么？')}
          />
        </label>
        <label>
          {t('描述')}
          <textarea
            name="description"
            rows={4}
            defaultValue={original?.description || ''}
            placeholder={t('补充细节、链接或想法…')}
          />
        </label>
        <div className="form-grid">
          <label>
            {t('优先级')}
            <select name="priority" defaultValue={original?.priority || ''}>
              <option value="">{t('不设置')}</option>
              <option value="low">{t('低')}</option>
              <option value="normal">{t('普通')}</option>
              <option value="high">{t('高')}</option>
              {original?.priority && !['low', 'normal', 'high'].includes(original.priority) && (
                <option value={original.priority}>{original.priority}</option>
              )}
            </select>
          </label>
          <label>
            {t('截止日期')}
            <input
              type="date"
              value={due}
              onChange={(e) => {
                setDue(e.target.value);
                if (!e.target.value) setTime('');
              }}
            />
          </label>
          <label>
            {t('截止时间')}
            <input
              type="time"
              disabled={!due}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            {t('主要标签')}
            <input name="primary" defaultValue={labelText('primary')} placeholder={t('可选')} />
          </label>
          <label>
            {t('次要标签')}
            <input name="secondary" defaultValue={labelText('secondary')} placeholder={t('可选')} />
          </label>
        </div>
        {error != null && (
          <p className="error" role="alert">
            {errorMessage(error, language)}
          </p>
        )}
        <footer className="form-actions">
          <button type="button" onClick={onClose}>
            {t('取消')}
          </button>
          <button className="primary" disabled={busy}>
            {t('保存卡片')}
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function TextWithLinks({
  text = '',
  shorten = false,
}: {
  text?: string | null;
  shorten?: boolean;
}) {
  const parts = (text ?? '').split(/(https?:\/\/[^\s<>"']+)/g);
  return parts.map((part, index) =>
    safeUrl(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {shorten ? part.replace(/^https?:\/\/(www\.)?/, '') : part}
      </a>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}
export function CardDetails({
  card,
  board,
  onClose,
  onEdit,
}: {
  card: Card;
  board?: Board;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = useT();
  return (
    <Dialog drawer title={t('卡片详情')} onClose={onClose}>
      <p className="eyebrow">{board?.title || t('未关联看板')}</p>
      <h3 className="detail-title">{card.title || t('未命名卡片')}</h3>
      <div className="chips">
        {card.labels?.map((l, i) => (
          <span key={i} className="chip">
            {l.text}
          </span>
        ))}
      </div>
      <p className="detail-description">
        <TextWithLinks text={card.description} />
      </p>
      <dl className="details-meta">
        <dt>{t('状态')}</dt>
        <dd>{card.completed ? t('已完成') : t('待完成')}</dd>
        <dt>{t('优先级')}</dt>
        <dd>
          {new Map([
            ['high', t('高')],
            ['normal', t('普通')],
            ['low', t('低')],
          ]).get(card.priority || '') ||
            card.priority ||
            t('未设置')}
        </dd>
        <dt>{t('截止')}</dt>
        <dd>{[card.dueDate, card.dueTime].filter(Boolean).join(' ') || t('未设置')}</dd>
        <dt>{t('创建于')}</dt>
        <dd>{card.createdAt || t('旧数据未记录')}</dd>
      </dl>
      <button className="primary" onClick={onEdit}>
        {t('编辑卡片')}
      </button>
    </Dialog>
  );
}

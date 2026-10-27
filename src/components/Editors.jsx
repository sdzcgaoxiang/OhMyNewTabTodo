import React, { useState } from 'react';
import { Dialog } from './Dialog.jsx';
import { safeUrl, newId } from '../model.js';
export function BoardEditor({ board, act, onClose }) {
  const [name, setName] = useState(board?.title || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={board ? '编辑看板' : '新建看板'} onClose={onClose}>
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
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          看板名称
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：今天、工作、生活"
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <footer className="form-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary" disabled={busy}>
            保存看板
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function CardEditor({ initial, state, act, onClose }) {
  const original = initial.card;
  const [due, setDue] = useState(original?.dueDate || ''),
    [time, setTime] = useState(original?.dueTime || ''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const labelText = (type) => original?.labels?.find((label) => label.type === type)?.text || '';
  async function save(e) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const labels = [...(original?.labels || [])];
    for (const type of ['primary', 'secondary']) {
      const index = labels.findIndex((l) => l.type === type),
        old = labels[index];
      if (fields[type] === (old?.text || '')) continue;
      if (!fields[type].trim()) {
        if (index >= 0) labels.splice(index, 1);
      } else {
        const label = { ...old, id: old?.id || newId('label'), type, text: fields[type].trim() };
        if (index >= 0) labels[index] = label;
        else labels.push(label);
      }
    }
    const patch = {
      title: fields.title,
      description: fields.description,
      priority: fields.priority,
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
              boardId: fields.boardId,
              expected: original,
              expectedBoardId: initial.boardId,
            }
          : { type: 'card.add', card: patch, boardId: fields.boardId, index: initial.index },
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={original ? '编辑卡片' : '添加卡片'} onClose={onClose}>
      <form onSubmit={save}>
        <label>
          所属看板
          <select name="boardId" defaultValue={initial.boardId}>
            {state.data.boardOrder.map((id) => (
              <option key={id} value={id}>
                {state.data.boards[id].title || '未命名看板'}
              </option>
            ))}
          </select>
        </label>
        <label>
          卡片标题
          <input
            name="title"
            autoFocus
            required
            defaultValue={original?.title || ''}
            placeholder="接下来想完成什么？"
          />
        </label>
        <label>
          描述
          <textarea
            name="description"
            rows="4"
            defaultValue={original?.description || ''}
            placeholder="补充细节、链接或想法…"
          />
        </label>
        <div className="form-grid">
          <label>
            优先级
            <select name="priority" defaultValue={original?.priority || ''}>
              <option value="">不设置</option>
              <option value="low">低</option>
              <option value="normal">普通</option>
              <option value="high">高</option>
              {original?.priority && !['low', 'normal', 'high'].includes(original.priority) && (
                <option value={original.priority}>{original.priority}</option>
              )}
            </select>
          </label>
          <label>
            截止日期
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
            截止时间
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
            主要标签
            <input name="primary" defaultValue={labelText('primary')} placeholder="可选" />
          </label>
          <label>
            次要标签
            <input name="secondary" defaultValue={labelText('secondary')} placeholder="可选" />
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer className="form-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary" disabled={busy}>
            保存卡片
          </button>
        </footer>
      </form>
    </Dialog>
  );
}
export function TextWithLinks({ text = '', shorten = false }) {
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
export function CardDetails({ card, board, onClose, onEdit }) {
  return (
    <Dialog drawer title="卡片详情" onClose={onClose}>
      <p className="eyebrow">{board?.title || '未关联看板'}</p>
      <h3 className="detail-title">{card.title || '未命名卡片'}</h3>
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
        <dt>状态</dt>
        <dd>{card.completed ? '已完成' : '待完成'}</dd>
        <dt>优先级</dt>
        <dd>
          {new Map([
            ['high', '高'],
            ['normal', '普通'],
            ['low', '低'],
          ]).get(card.priority) ||
            card.priority ||
            '未设置'}
        </dd>
        <dt>截止</dt>
        <dd>{[card.dueDate, card.dueTime].filter(Boolean).join(' ') || '未设置'}</dd>
        <dt>创建于</dt>
        <dd>{card.createdAt || '旧数据未记录'}</dd>
      </dl>
      <button className="primary" onClick={onEdit}>
        编辑卡片
      </button>
    </Dialog>
  );
}

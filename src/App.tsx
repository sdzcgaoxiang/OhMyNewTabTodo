import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { flushSync } from 'react-dom';
import { readState, dispatch, subscribe } from './client.ts';
import { boardDropIndex, cardDropIndex } from './drag-position.ts';
import { applyOperation } from './model.ts';
import { BoardEditor, CardEditor, CardDetails, TextWithLinks } from './components/Editors.tsx';
import { Confirm } from './components/Dialog.tsx';
import { Settings, Bookmarks } from './components/Settings.tsx';
import { duePresentation } from './dates.ts';
import type { ModelOperation, RepositoryOperation } from './operations.ts';
import type { AppState, Board, Card, Options } from './types.ts';
import type { CardInitial } from './components/ui.ts';
import { errorMessage } from './components/ui.ts';
const engines = [
  ['Google', 'hideGoogleSearch', 'https://www.google.com/search', 'q', 'G'],
  ['Bing', 'hideBingSearch', 'https://www.bing.com/search', 'q', 'b'],
  ['DuckDuckGo', 'hideDuckDuckGoSearch', 'https://duckduckgo.com/', 'q', 'D'],
  ['YouTube', 'hideYoutubeSearch', 'https://www.youtube.com/results', 'search_query', '▶'],
] as const;
type Modal =
  | { type: 'board'; board?: Board }
  | { type: 'card'; initial: CardInitial }
  | { type: 'details'; cardId: string; boardId: string };
interface ConfirmState {
  title: string;
  text: string;
  action?: string;
  operation: RepositoryOperation;
}
function Clock({ options }: { options: Options }) {
  const [now, setNow] = useState(new Date()),
    [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    setVisible(true);
    if (!options.pinClock) {
      const timer = setTimeout(() => setVisible(false), 4500);
      return () => clearTimeout(timer);
    }
  }, [options.pinClock, options.showClock]);
  return options.showClock && visible ? (
    <div className="clock">
      <time>
        {now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: !options.twentyFourHours,
        })}
      </time>
      <span>
        {now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
      </span>
    </div>
  ) : null;
}
function beep() {
  try {
    const audio = new AudioContext(),
      oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    oscillator.frequency.value = 720;
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.15);
    oscillator.onended = () => audio.close();
  } catch {
    /* Audio is optional. */
  }
}
function TaskCard({
  card,
  board,
  index,
  dragIndex,
  state,
  perform,
  edit,
  detail,
  confirm,
  now,
}: {
  card: Card;
  board: Board;
  index: number;
  dragIndex: number;
  state: AppState;
  perform: (operation: RepositoryOperation) => Promise<boolean>;
  edit: () => void;
  detail: () => void;
  confirm: (value: ConfirmState) => void;
  now: Date;
}) {
  const due = duePresentation(card, now);
  return (
    <Draggable
      draggableId={card.id}
      index={dragIndex}
      isDragDisabled={state.options.hideCompletedCards && card.completed}
    >
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          aria-label={`拖动卡片：${card.title || '未命名卡片'}`}
          style={provided.draggableProps.style}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${card.completed ? 'completed' : ''} ${state.options.dimCompletedCards ? 'dim-enabled' : ''} ${state.options.showCompactCards ? 'compact' : ''}`}
          onDoubleClick={(e) => {
            if (e.target instanceof Element && !e.target.closest('button,input,select,a')) edit();
          }}
        >
          <div className="card-heading">
            <input
              type="checkbox"
              aria-label={card.completed ? '取消完成' : '标记完成'}
              checked={!!card.completed}
              onChange={async () => {
                const ok = await perform({ type: 'card.toggle', id: card.id });
                if (ok && !card.completed && state.options.playSoundEffects) beep();
              }}
            />
            <button className="card-title" onClick={detail}>
              {card.title || '未命名卡片'}
            </button>
          </div>
          {!state.options.showCompactCards && (
            <>
              <div className="chips">
                {card.labels?.map((label, i) => (
                  <span className={`chip ${label.type === 'secondary' ? 'secondary' : ''}`} key={i}>
                    {label.text}
                  </span>
                ))}
              </div>
              {card.description && !state.options.hideCardDescription && (
                <p className="card-description">
                  <TextWithLinks text={card.description} shorten={state.options.linkFormatting} />
                </p>
              )}
              <div className="card-meta">
                {card.dueDate && (
                  <span
                    className={`due-date ${due.overdue ? 'overdue' : ''}`}
                    title={[card.dueDate, card.dueTime].filter(Boolean).join(' ')}
                  >
                    ◷ {due.text}
                  </span>
                )}
                {card.priority && (
                  <span className={`priority ${card.priority === 'high' ? 'high' : ''}`}>
                    ●{' '}
                    {new Map([
                      ['high', '高优先级'],
                      ['normal', '普通'],
                      ['low', '低优先级'],
                    ]).get(card.priority) || card.priority}
                  </span>
                )}
              </div>
            </>
          )}
          <div className="card-actions">
            <button aria-label="编辑卡片" title="编辑卡片" onClick={edit}>
              编辑
            </button>
            <button
              aria-label="复制卡片"
              title="复制卡片"
              onClick={() => perform({ type: 'card.copy', id: card.id })}
            >
              复制
            </button>
            <button
              aria-label="卡片上移"
              disabled={index === 0}
              onClick={() =>
                perform({ type: 'card.move', id: card.id, boardId: board.id, index: index - 1 })
              }
            >
              ↑
            </button>
            <button
              aria-label="卡片下移"
              disabled={index === board.cardIds.length - 1}
              onClick={() =>
                perform({ type: 'card.move', id: card.id, boardId: board.id, index: index + 1 })
              }
            >
              ↓
            </button>
            <button
              aria-label="删除卡片"
              title="删除卡片"
              onClick={() =>
                confirm({
                  title: '删除卡片',
                  text: `删除“${card.title}”？`,
                  operation: { type: 'card.delete', id: card.id, expected: card },
                })
              }
            >
              删除
            </button>
          </div>
          {state.data.boardOrder.length > 1 && (
            <label className="move-select">
              <span>移动到</span>
              <select
                aria-label="移动到看板"
                value={board.id}
                onChange={(e) =>
                  perform({ type: 'card.move', id: card.id, boardId: e.target.value })
                }
              >
                {state.data.boardOrder.map((id) => (
                  <option key={id} value={id}>
                    {state.data.boards[id].title || '未命名看板'}
                  </option>
                ))}
              </select>
            </label>
          )}
        </article>
      )}
    </Draggable>
  );
}
export default function App() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const update = () => setNow(new Date()),
      interval = setInterval(update, 30000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const [state, setState] = useState<AppState | null>(null),
    [fatal, setFatal] = useState(''),
    [pending, setPending] = useState(0),
    [notice, setNotice] = useState<string | null>(null),
    [panel, setPanel] = useState<'bookmarks' | 'settings' | null>(null),
    [modal, setModal] = useState<Modal | null>(null),
    [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [showHidden, setShowHidden] = useState(false),
    [showCompleted, setShowCompleted] = useState(false),
    [engine, setEngine] = useState('Google');
  const accept = (next: AppState) =>
    setState((old) => (!old || next.revision >= old.revision ? next : old));
  useEffect(() => {
    let active = true;
    const off = subscribe((next) => {
      if (active) accept(next);
    });
    readState()
      .then((next) => {
        if (active) accept(next);
      })
      .catch((e) => {
        if (active) setFatal(errorMessage(e));
      });
    return () => {
      active = false;
      off();
    };
  }, []);
  useEffect(() => {
    if (state) document.documentElement.style.colorScheme = state.theme;
  }, [state?.theme]);
  async function act(operation: RepositoryOperation): Promise<AppState> {
    setPending((n) => n + 1);
    try {
      const next = await dispatch(operation);
      accept(next);
      setNotice(null);
      return next;
    } catch (e) {
      setNotice(errorMessage(e));
      throw e;
    } finally {
      setPending((n) => n - 1);
    }
  }
  async function perform(operation: RepositoryOperation): Promise<boolean> {
    try {
      await act(operation);
      return true;
    } catch {
      return false;
    }
  }
  if (fatal)
    return (
      <main className="fatal">
        <h1>数据暂时无法读取</h1>
        <p role="alert">{fatal}</p>
        <p>请保留当前扩展，不要卸载或清空数据。</p>
        <button onClick={() => location.reload()}>重新读取</button>
      </main>
    );
  if (!state) return <main className="loading">正在打开你的看板…</main>;
  const activeEngines = engines.filter((e) => !state.options[e[1]]),
    currentEngine = activeEngines.find((e) => e[0] === engine) || activeEngines[0];
  const visibleBoards = state.data.boardOrder.filter(
    (id) => !state.options.allowHidingBoard || showHidden || !state.data.boards[id]?.isHidden,
  );
  const allCards = state.data.boardOrder
      .flatMap((id) => state.data.boards[id].cardIds)
      .map((id) => state.data.cards[id])
      .filter(Boolean),
    done = allCards.filter((c) => c.completed).length;
  const dragState = state;
  function editCard(card: Card, boardId: string): void {
    setModal({ type: 'card', initial: { card: structuredClone(card), boardId } });
  }
  function commitDrag(operation: ModelOperation): void {
    flushSync(() =>
      setState((current) => {
        if (!current) return current;
        try {
          return applyOperation(current, operation);
        } catch {
          return current;
        }
      }),
    );
    void perform(operation).then((ok) => {
      if (ok) return;
      setState((current) => (current?.revision === dragState.revision ? dragState : current));
      void readState()
        .then(accept)
        .catch((error) => setNotice(errorMessage(error)));
    });
  }
  function onDragEnd(result: DropResult): void {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;
    if (type === 'board') {
      const index = boardDropIndex(
        dragState.data.boardOrder,
        visibleBoards,
        draggableId,
        destination.index,
      );
      commitDrag({ type: 'board.move', id: draggableId, index });
      return;
    }
    const target = dragState.data.boards[destination.droppableId];
    if (!target) return;
    const visibleCardIds = target.cardIds.filter((id) => {
      const card = dragState.data.cards[id];
      return card && (!card.completed || !dragState.options.hideCompletedCards || showCompleted);
    });
    const index = cardDropIndex(target.cardIds, visibleCardIds, draggableId, destination.index);
    commitDrag({ type: 'card.move', id: draggableId, boardId: target.id, index });
  }
  return (
    <div className="app" data-theme={state.theme}>
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">✓</span>
          <span>
            OhMy<span className="brand-light">NewTabTodo</span>
          </span>
        </a>
        {currentEngine && (
          <form className="search-box" action={currentEngine[2]} method="get">
            <select
              aria-label="搜索引擎"
              value={currentEngine[0]}
              onChange={(e) => setEngine(e.target.value)}
            >
              {activeEngines.map((e) => (
                <option key={e[0]} value={e[0]}>
                  {e[0]}
                </option>
              ))}
            </select>
            <input
              aria-label="搜索网页"
              name={currentEngine[3]}
              placeholder="搜索网页，继续探索…"
              autoComplete="off"
            />
            <button aria-label="开始搜索">↗</button>
          </form>
        )}
        <nav className="top-actions" aria-label="主要操作">
          <button
            className="icon-button"
            aria-label="切换主题"
            title="切换主题"
            onClick={() =>
              perform({ type: 'theme', theme: state.theme === 'dark' ? 'light' : 'dark' })
            }
          >
            {state.theme === 'dark' ? '☼' : '☾'}
          </button>
          <button onClick={() => setPanel('bookmarks')}>常用链接</button>
          <button onClick={() => setPanel('settings')}>设置</button>
        </nav>
      </header>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">YOUR SPACE, YOUR PACE</p>
          <h1>
            我的看板<span className="workspace-count">{state.data.boardOrder.length}</span>
          </h1>
          <p className="muted">整理想法，把每一天过得更清晰。</p>
        </div>
        <Clock options={state.options} />
      </section>
      <div className="workspace-toolbar">
        <div className="progress-summary">
          <span className="status-dot" />
          <span>{allCards.length ? `${done} / ${allCards.length} 已完成` : '从一件小事开始'}</span>
          <span className="save-state" role="status">
            {pending ? '正在保存…' : notice ? '保存失败' : '本机已保存'}
          </span>
        </div>
        <div className="workspace-controls">
          {state.options.allowHidingBoard && (
            <button
              className={showHidden ? 'selected' : ''}
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? '收起隐藏看板' : '显示隐藏看板'}
            </button>
          )}
          {state.options.hideCompletedCards && (
            <button onClick={() => setShowCompleted(!showCompleted)}>
              {showCompleted ? '隐藏完成项' : '显示完成项'}
            </button>
          )}
          <button className="primary" onClick={() => setModal({ type: 'board' })}>
            新建看板
          </button>
        </div>
      </div>
      {notice && (
        <div className="toast error" role="alert">
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-boards" direction="horizontal" type="board">
          {(boardDrop) => (
            <main
              ref={boardDrop.innerRef}
              {...boardDrop.droppableProps}
              className="boards"
              aria-label="看板列表"
              onWheel={(e) => {
                if (
                  e.target instanceof Element &&
                  !e.target.closest('.board-card-list') &&
                  Math.abs(e.deltaX) < Math.abs(e.deltaY)
                )
                  e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              {visibleBoards.map((id, dragIndex) => {
                const board = state.data.boards[id],
                  boardIndex = state.data.boardOrder.indexOf(id),
                  cards = board.cardIds.map((id) => state.data.cards[id]).filter(Boolean),
                  visibleCards = cards.filter(
                    (card) => !card.completed || !state.options.hideCompletedCards || showCompleted,
                  );
                return (
                  <Draggable draggableId={id} index={dragIndex} key={id}>
                    {(boardDrag, boardSnapshot) => (
                      <section
                        ref={boardDrag.innerRef}
                        {...boardDrag.draggableProps}
                        style={boardDrag.draggableProps.style}
                        className={`board ${boardSnapshot.isDragging ? 'dragging' : ''} ${board.isHidden ? 'hidden-board' : ''}`}
                      >
                        <header
                          className="board-header"
                          {...boardDrag.dragHandleProps}
                          aria-label={`拖动看板：${board.title || '未命名看板'}`}
                        >
                          <span className="board-accent" />
                          <h2
                            onDoubleClick={() =>
                              setModal({ type: 'board', board: structuredClone(board) })
                            }
                          >
                            {board.title || '未命名看板'}
                          </h2>
                          <span className="count">
                            {cards.filter((c) => c.completed).length}/{cards.length}
                          </span>
                          <button
                            className="icon-button"
                            aria-label="添加卡片到顶部"
                            title="添加卡片到顶部"
                            onClick={() =>
                              setModal({ type: 'card', initial: { boardId: id, index: 0 } })
                            }
                          >
                            ＋
                          </button>
                        </header>
                        <div className="board-controls">
                          <button
                            aria-label="编辑看板"
                            onClick={() =>
                              setModal({ type: 'board', board: structuredClone(board) })
                            }
                          >
                            编辑
                          </button>
                          {state.options.allowHidingBoard && (
                            <button
                              onClick={() =>
                                perform({
                                  type: 'board.update',
                                  id,
                                  patch: { isHidden: !board.isHidden },
                                })
                              }
                            >
                              {board.isHidden ? '恢复显示' : '隐藏'}
                            </button>
                          )}
                          <button
                            aria-label="看板左移"
                            disabled={boardIndex === 0}
                            onClick={() =>
                              perform({ type: 'board.move', id, index: boardIndex - 1 })
                            }
                          >
                            ←
                          </button>
                          <button
                            aria-label="看板右移"
                            disabled={boardIndex === state.data.boardOrder.length - 1}
                            onClick={() =>
                              perform({ type: 'board.move', id, index: boardIndex + 1 })
                            }
                          >
                            →
                          </button>
                          <button
                            aria-label="删除看板"
                            onClick={() =>
                              setConfirm({
                                title: '删除看板',
                                text: `删除“${board.title}”及其 ${cards.length} 张卡片？`,
                                operation: { type: 'board.delete', id, expected: board },
                              })
                            }
                          >
                            删除
                          </button>
                        </div>
                        <Droppable droppableId={id} type="card">
                          {(cardDrop, cardSnapshot) => (
                            <div
                              ref={cardDrop.innerRef}
                              {...cardDrop.droppableProps}
                              className={`board-card-list ${cardSnapshot.isDraggingOver ? 'drag-over' : ''}`}
                            >
                              {visibleCards.map((card, dragIndex) => (
                                <TaskCard
                                  key={card.id}
                                  {...{
                                    card,
                                    board,
                                    dragIndex,
                                    state,
                                    perform,
                                    now,
                                  }}
                                  index={board.cardIds.indexOf(card.id)}
                                  edit={() => editCard(card, id)}
                                  detail={() =>
                                    setModal({ type: 'details', cardId: card.id, boardId: id })
                                  }
                                  confirm={setConfirm}
                                />
                              ))}
                              {!cards.some(
                                (c) =>
                                  !c.completed ||
                                  !state.options.hideCompletedCards ||
                                  showCompleted,
                              ) && (
                                <div className="empty-board">
                                  <span>✓</span>
                                  <p>
                                    {cards.length ? '都完成了，做得不错' : '留一点空间给新想法'}
                                  </p>
                                </div>
                              )}
                              {cardDrop.placeholder}
                            </div>
                          )}
                        </Droppable>
                        <button
                          className="add-card"
                          aria-label="添加卡片到底部"
                          onClick={() => setModal({ type: 'card', initial: { boardId: id } })}
                        >
                          ＋ 添加卡片
                        </button>
                      </section>
                    )}
                  </Draggable>
                );
              })}
              {boardDrop.placeholder}
              {!visibleBoards.length && (
                <section className="empty-workspace">
                  <div className="empty-illustration">
                    <i />
                    <i />
                    <i />
                  </div>
                  <h2>{state.data.boardOrder.length ? '看板已隐藏' : '给今天一个清晰的开始'}</h2>
                  <p>
                    {state.data.boardOrder.length
                      ? '点击“显示隐藏看板”找回它们。'
                      : '创建一个看板，或在设置中导入 NewTabTodo 数据。'}
                  </p>
                  <button className="primary" onClick={() => setModal({ type: 'board' })}>
                    新建看板
                  </button>
                  <button onClick={() => setPanel('settings')}>导入已有数据</button>
                </section>
              )}
              {!!visibleBoards.length && (
                <button
                  className="add-board-column"
                  aria-label="再建一个看板"
                  onClick={() => setModal({ type: 'board' })}
                >
                  <span>＋</span>新建看板
                </button>
              )}
            </main>
          )}
        </Droppable>
      </DragDropContext>
      <footer className="app-footer">
        <span>本地保存 · 无追踪</span>
        <span>
          OhMyNewTabTodo <span className="version">0.2.0</span>
        </span>
      </footer>
      {modal?.type === 'board' && (
        <BoardEditor board={modal.board} act={act} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'card' && (
        <CardEditor
          initial={modal.initial}
          state={state}
          act={act}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'details' &&
        (state.data.cards[modal.cardId] ? (
          <CardDetails
            card={state.data.cards[modal.cardId]}
            board={state.data.boards[modal.boardId]}
            onClose={() => setModal(null)}
            onEdit={() => editCard(state.data.cards[modal.cardId], modal.boardId)}
          />
        ) : (
          <Confirm
            title="卡片已被删除"
            text="另一页面已删除这张卡片。"
            action="关闭"
            onConfirm={() => {}}
            onClose={() => setModal(null)}
          />
        ))}
      {panel === 'settings' && <Settings state={state} act={act} onClose={() => setPanel(null)} />}
      {panel === 'bookmarks' && (
        <Bookmarks state={state} act={act} onClose={() => setPanel(null)} />
      )}
      {confirm && (
        <Confirm
          {...confirm}
          onConfirm={() => act(confirm.operation)}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

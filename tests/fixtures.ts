import type { Board, Bookmark, Card } from '../src/types.ts';

export interface LegacyFixture {
  id: number;
  appVersion: string;
  boardOrder: string[];
  boards: Record<string, Board>;
  cards: Record<string, Card>;
  bookmarks?: Bookmark[];
}

export const legacy = (): LegacyFixture => ({
  id: 123,
  appVersion: '0.2.0',
  boardOrder: ['board-a'],
  boards: {
    'board-a': { id: 'board-a', title: '工作', cardIds: ['card-a'] },
    'board-b': { id: 'board-b', title: '待恢复', cardIds: ['card-b'], isHidden: true },
  },
  cards: {
    'card-a': {
      id: 'card-a',
      title: '检查导出',
      description: '<img src=x>中文',
      labels: [{ id: 'label-a', text: '重要', type: 'primary' }],
      tags: [{ id: 't', color: '#f00', text: '旧字段' }],
      history: [{ action: 'created' }],
      createdAt: '2020-01-01',
      custom: { keep: true },
    },
    'card-b': { id: 'card-b', title: '恢复任务', dueDate: '2026-12-31', dueTime: '09:30' },
  },
});

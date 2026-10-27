import type { Board, Card, Options, Theme } from './types.ts';

export type ModelOperation =
  | { type: 'board.add'; title: string; id?: string }
  | {
      type: 'board.update';
      id: string;
      patch: Partial<Pick<Board, 'title' | 'isHidden'>>;
      expected?: Board;
    }
  | { type: 'board.delete'; id: string; expected?: Board }
  | { type: 'board.move'; id: string; index: number }
  | {
      type: 'card.add';
      boardId: string;
      card: Partial<Card> & Pick<Card, 'title'>;
      id?: string;
      index?: number;
    }
  | {
      type: 'card.update';
      id: string;
      patch: Partial<Card>;
      boardId?: string;
      expected?: Card;
      expectedBoardId?: string;
    }
  | { type: 'card.delete'; id: string; expected?: Card }
  | { type: 'card.copy'; id: string; newId?: string }
  | { type: 'card.move'; id: string; boardId: string; index?: number }
  | { type: 'card.toggle'; id: string }
  | { type: 'completed.bottom' }
  | { type: 'options.patch'; patch: Partial<Options> }
  | { type: 'theme'; theme: Theme }
  | { type: 'bookmark.add'; bookmark: { name: string; url: string; [key: string]: unknown } }
  | { type: 'bookmark.delete'; id: string };

export type RepositoryOperation =
  | ModelOperation
  | {
      type: 'import';
      text: string;
      expectedRevision: number;
      mode?: 'merge' | 'replace' | 'copy';
      recoverBoards?: boolean;
      recoverCards?: boolean;
    }
  | { type: 'restore'; id: string; expectedRevision: number }
  | { type: 'clear'; expectedRevision: number };

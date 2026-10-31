import type { RepositoryOperation } from '../operations.ts';
import type { AppState, Card } from '../types.ts';
import type { Language } from '../types.ts';
import { formatIssue } from '../i18n.ts';

export type Act = (operation: RepositoryOperation) => Promise<AppState>;
export interface CardInitial {
  boardId: string;
  card?: Card;
  index?: number;
}
export const errorMessage = (error: unknown, language: Language = 'zh-CN'): string =>
  formatIssue(language, error);

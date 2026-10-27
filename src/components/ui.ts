import type { RepositoryOperation } from '../operations.ts';
import type { AppState, Card } from '../types.ts';

export type Act = (operation: RepositoryOperation) => Promise<AppState>;
export interface CardInitial {
  boardId: string;
  card?: Card;
  index?: number;
}
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

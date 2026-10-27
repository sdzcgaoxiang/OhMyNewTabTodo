import type { RepositoryOperation } from './operations.ts';
import type { AppState } from './types.ts';

export type RuntimeRequest =
  { type: 'read' } | { type: 'dispatch'; operation: RepositoryOperation };

export type RuntimeResponse = { ok: true; state: AppState } | { ok: false; error: string };

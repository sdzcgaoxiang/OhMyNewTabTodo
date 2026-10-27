import type { ModelOperation, RepositoryOperation } from '../../src/operations.ts';

const move: ModelOperation = { type: 'card.move', id: 'card-a', boardId: 'board-b' };
void move;

// @ts-expect-error A move needs its target board ID.
const missingBoard: ModelOperation = { type: 'card.move', id: 'card-a' };
void missingBoard;

// @ts-expect-error Unknown operations are rejected at compile time.
const unknownOperation: ModelOperation = { type: 'card.launch', id: 'card-a' };
void unknownOperation;

// @ts-expect-error Destructive operations require the preview revision.
const staleClear: RepositoryOperation = { type: 'clear' };
void staleClear;

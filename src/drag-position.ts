function dropIndex(
  fullIds: string[],
  visibleIds: string[],
  draggedId: string,
  visibleIndex: number,
): number {
  const remaining = fullIds.filter((id) => id !== draggedId);
  const visibleRemaining = visibleIds.filter((id) => id !== draggedId);
  const index = Math.max(0, Math.min(visibleIndex, visibleRemaining.length));
  const nextId = visibleRemaining[index];
  if (nextId !== undefined) return remaining.indexOf(nextId);
  const lastId = visibleRemaining.at(-1);
  return lastId === undefined ? 0 : remaining.indexOf(lastId) + 1;
}

export const cardDropIndex = dropIndex;
export const boardDropIndex = dropIndex;

export interface Board {
  id: string;
  title: string;
  cardIds: string[];
  isHidden?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface Label {
  id?: string;
  text: string;
  type?: string;
  [key: string]: unknown;
}

export interface Card {
  id: string;
  title: string;
  completed?: boolean;
  description?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  labels?: Label[] | null;
  tags?: Array<{ text: string; [key: string]: unknown }> | null;
  history?: unknown[] | null;
  priority?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  [key: string]: unknown;
}

export interface AppData {
  boards: Record<string, Board>;
  cards: Record<string, Card>;
  boardOrder: string[];
  [key: string]: unknown;
}

export interface Options {
  playSoundEffects: boolean;
  allowHidingBoard: boolean;
  hideCardDescription: boolean;
  linkFormatting: boolean;
  dimCompletedCards: boolean;
  hideCompletedCards: boolean;
  showCompactCards: boolean;
  hideGoogleSearch: boolean;
  hideDuckDuckGoSearch: boolean;
  hideBingSearch: boolean;
  hideYoutubeSearch: boolean;
  showClock: boolean;
  twentyFourHours: boolean;
  pinClock: boolean;
  [key: string]: unknown;
}

export type Theme = 'light' | 'dark';

export interface Snapshot {
  data: AppData;
  bookmarks: Bookmark[];
  options: Options;
  theme: Theme;
  [key: string]: unknown;
}

export interface RecoveryPoint {
  id: string;
  createdAt: string;
  label: string;
  state: Snapshot;
  [key: string]: unknown;
}

export interface AppState extends Snapshot {
  schemaVersion: 1;
  revision: number;
  backups: RecoveryPoint[];
  imports: unknown[];
}

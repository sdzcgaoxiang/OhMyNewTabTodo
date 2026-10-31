import type { Language } from './types.ts';
import type { IssuePayload } from './issues.ts';

const en = {
  'home.boards': 'My boards',
  'home.completedCount': '{done} / {total} completed',
} as const;
const zh: Record<keyof typeof en, string> = {
  'home.boards': '我的看板',
  'home.completedCount': '{done} / {total} 已完成',
};
export type TranslationKey = keyof typeof en;

const issueText: Record<Language, Record<string, string>> = {
  en: {
    'client.extensionRequired': 'Load the dist folder as a Chrome extension to use this page.',
    'client.backgroundUnavailable':
      'The extension background did not respond. Open a new tab and try again.',
    'client.invalidResponse':
      'The extension background returned invalid data. Open a new tab and try again.',
    'repository.unsupportedVersion':
      'This local data version is unsupported. Keep the extension installed and update it.',
    'repository.invalidState':
      'Local data has an unexpected structure. Keep your backup and inspect it before continuing.',
    'repository.missingPreview':
      'The preview is missing. Preview the file again before continuing.',
    'repository.stalePreview': 'Data changed after the preview. Preview the file again.',
    'repository.recoveryMissing': 'This recovery point no longer exists.',
    'repository.writeFailed': 'Could not read or save local data. Please try again.',
    'model.titleRequired': 'A title is required.',
    'model.itemDeleted': 'This item was deleted. Refresh and try again.',
    'model.editConflict': 'Another tab changed this content. Keep your draft and reopen it.',
    'model.boardIdConflict': 'Board ID conflict.',
    'model.cardIdConflict': 'Card ID conflict.',
    'model.cardMoved': 'Another tab moved this card. Keep your draft and reopen it.',
    'model.cardUnassigned': 'This card is not assigned to a board. Recover it first.',
    'model.themeInvalid': 'Invalid theme.',
    'model.languageInvalid': 'Invalid language.',
    'model.urlInvalid': 'Enter a valid http or https URL.',
    'model.unknownOperation': 'Unknown operation.',
    'import.invalidIdArray': '{field} must be a valid ID list.',
    'import.invalidData': 'Invalid file: data must be an object.',
    'import.invalidCollections': 'Invalid file: boards and cards must be objects.',
    'import.duplicateBoardOrder': 'boardOrder has duplicate IDs.',
    'import.unsafeId': '{name} contains an invalid ID key.',
    'import.mismatchedId': '{name} contains an object whose ID does not match its key.',
    'import.titleNotText': 'A {name} title must be text.',
    'import.fieldNotText': '{field} must be text.',
    'import.fieldNotBoolean': '{field} must be true or false.',
    'import.missingOrderedBoard': 'The display order references a missing board: {id}.',
    'import.boardNotObject': 'A board must be an object.',
    'import.duplicateCardRef': 'A board contains duplicate card references.',
    'import.cardMissing': 'A board references a missing card: {id}.',
    'import.cardMultipleBoards': 'Card {id} is referenced by more than one board.',
    'import.cardNotObject': 'A card must be an object.',
    'import.fieldNotArray': '{field} must be an array.',
    'import.entryMissingText': 'An entry in {field} must contain text.',
    'import.bookmarksNotArray': 'bookmarks must be an array.',
    'import.bookmarkInvalid': 'A bookmark must contain a name and URL.',
    'import.bookmarkIdInvalid': 'Invalid bookmark ID.',
    'import.bookmarkIdDuplicate': 'Duplicate bookmark IDs.',
    'import.contentRequired': 'JSON file content is required.',
    'import.fileTooLarge': 'The file is over 5 MiB. Split it or reduce its size.',
    'import.fileFormat': 'Invalid file format.',
    'import.backupFormat': 'Unsupported backup format.',
    'import.backupVersion': 'Unsupported backup version. Update the extension and try again.',
    'import.backupDataMissing': 'The full backup is missing state.data.',
    'import.backupOptionsMissing': 'The full backup is missing settings.',
    'import.optionType': 'Setting {key} has an invalid type.',
    'import.backupThemeInvalid': 'Invalid backup theme.',
    'import.backupLanguageInvalid': 'Invalid backup language.',
    'import.modeInvalid': 'Invalid import mode.',
    'import.emptyTitle': 'An empty title was kept as is; you can edit it after import.',
    'import.invalidBookmarkUrl': 'A bookmark URL cannot be opened safely; its data was kept.',
    'import.missingBookmarks': 'The original export has no bookmarks; an empty list was used.',
    'import.orphanBoards':
      '{count} board{plural} {verb} missing from display order; data was kept.',
    'import.orphanCards': '{count} card{plural} {verb} not assigned to a board; data was kept.',
    'import.conflict': 'ID {id} has conflicting content. Use Copy or Replace.',
    'import.bookmarkConflict': 'Bookmark ID {id} has conflicting content. Use Copy or Replace.',
    'import.invalidJson': 'Could not read JSON. Check that the file is complete.',
  },
  'zh-CN': {
    'import.emptyTitle': '存在空标题，将原样保留，可在导入后编辑。',
    'import.invalidBookmarkUrl': '有书签地址无法安全打开；数据会保留，但不会成为链接。',
    'import.missingBookmarks': '原版导出缺少 bookmarks，已按空书签列表读取。',
    'import.orphanBoards': '{count} 个看板未列入显示顺序；数据将保留。',
    'import.orphanCards': '{count} 张卡片未关联看板；数据将保留，可恢复到新看板。',
    'import.conflict': 'ID {id} 内容冲突。请改用“作为副本”或“替换”。',
    'import.bookmarkConflict': '书签 ID {id} 内容冲突。请改用“作为副本”或“替换”。',
    'import.invalidJson': '无法解析 JSON，请检查文件是否完整',
  },
};
const recoveryLabels: Record<string, [string, string]> = {
  导入前: ['Before import', '导入前'],
  恢复前: ['Before restore', '恢复前'],
  清空前: ['Before clear', '清空前'],
};

function interpolate(template: string, values?: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values?.[key] ?? `{${key}}`));
}

export function translate(
  language: Language,
  key: TranslationKey,
  values?: Record<string, string | number>,
): string {
  return interpolate((language === 'zh-CN' ? zh : en)[key], values);
}

export function formatIssue(language: Language, value: IssuePayload | unknown): string {
  if (value && typeof value === 'object' && 'code' in value && typeof value.code === 'string') {
    const issue = value as IssuePayload;
    const template = issueText[language][issue.code];
    if (template) {
      const values = { ...issue.values };
      if (issue.code === 'import.orphanBoards' || issue.code === 'import.orphanCards') {
        values.plural = Number(values.count) === 1 ? '' : 's';
        values.verb = Number(values.count) === 1 ? 'is' : 'are';
      }
      return interpolate(template, values);
    }
  }
  if (language === 'zh-CN' && value instanceof Error) return value.message;
  return language === 'zh-CN' ? '发生错误，请重试。' : 'Something went wrong. Please try again.';
}

export function formatRecoveryLabel(language: Language, label: string): string {
  const known = recoveryLabels[label];
  return known ? known[language === 'zh-CN' ? 1 : 0] : label;
}

export function formatClockDate(language: Language, date: Date): string {
  return new Intl.DateTimeFormat(language === 'zh-CN' ? 'zh-CN' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

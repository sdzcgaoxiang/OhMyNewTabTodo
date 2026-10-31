import type { Language } from './types.ts';
import type { IssuePayload } from './issues.ts';

const en = {
  'home.boards': 'My boards',
  'home.completedCount': '{done} / {total} completed',
  'app.dragCard': 'Drag card: {title}',
  'app.dragBoard': 'Drag board: {title}',
  'app.deleteCardQuestion': 'Delete “{title}”?',
  'app.deleteBoardQuestion': 'Delete “{title}” and its {count} card{plural}?',
  'app.deleteLink': 'Delete link {name}',
  'app.recoveredBoardNames':
    '{names}. The data is kept even if this stays unchecked; hidden boards remain hidden.',
  'app.backupCardCount': '{count} card{plural}',
  数据暂时无法读取: 'Local data is temporarily unavailable',
  '请保留当前扩展，不要卸载或清空数据。': 'Keep this extension installed. Do not clear its data.',
  重新读取: 'Try again',
  '正在打开你的看板…': 'Opening your boards…',
  搜索引擎: 'Search engine',
  搜索网页: 'Search the web',
  '搜索网页，继续探索…': 'Search the web and keep exploring…',
  开始搜索: 'Search',
  主要操作: 'Main actions',
  界面语言: 'Interface language',
  切换主题: 'Switch theme',
  常用链接: 'Quick links',
  设置: 'Settings',
  '整理想法，把每一天过得更清晰。': 'Organize your thoughts and make each day clearer.',
  从一件小事开始: 'Start with one small thing',
  '正在保存…': 'Saving…',
  保存失败: 'Save failed',
  本机已保存: 'Saved locally',
  收起隐藏看板: 'Hide hidden boards',
  显示隐藏看板: 'Show hidden boards',
  隐藏完成项: 'Hide completed',
  显示完成项: 'Show completed',
  新建看板: 'New board',
  关闭提示: 'Dismiss notice',
  看板列表: 'Board list',
  未命名看板: 'Untitled board',
  未命名卡片: 'Untitled card',
  取消完成: 'Mark incomplete',
  标记完成: 'Mark complete',
  高优先级: 'High priority',
  普通: 'Normal',
  低优先级: 'Low priority',
  编辑卡片: 'Edit card',
  复制卡片: 'Copy card',
  卡片上移: 'Move card up',
  卡片下移: 'Move card down',
  删除卡片: 'Delete card',
  编辑: 'Edit',
  复制: 'Copy',
  删除: 'Delete',
  移动到: 'Move to',
  移动到看板: 'Move to board',
  添加卡片到顶部: 'Add card to top',
  编辑看板: 'Edit board',
  恢复显示: 'Show again',
  隐藏: 'Hide',
  看板左移: 'Move board left',
  看板右移: 'Move board right',
  删除看板: 'Delete board',
  '都完成了，做得不错': 'All done. Nice work.',
  留一点空间给新想法: 'Leave room for new ideas',
  添加卡片到底部: 'Add card to bottom',
  添加卡片: 'Add card',
  看板已隐藏: 'Boards are hidden',
  给今天一个清晰的开始: 'A clear start for today',
  '点击“显示隐藏看板”找回它们。': 'Select “Show hidden boards” to find them.',
  '创建一个看板，或在设置中导入 NewTabTodo 数据。':
    'Create a board or import NewTabTodo data in Settings.',
  导入已有数据: 'Import existing data',
  再建一个看板: 'Create another board',
  '本地保存 · 无追踪': 'Local storage · No tracking',
  卡片已被删除: 'Card was deleted',
  '另一页面已删除这张卡片。': 'Another tab deleted this card.',
  关闭: 'Close',
  关闭窗口: 'Close dialog',
  确认删除: 'Confirm delete',
  取消: 'Cancel',
  '处理中…': 'Working…',
  看板名称: 'Board name',
  '例如：今天、工作、生活': 'For example: Today, Work, Life',
  保存看板: 'Save board',
  所属看板: 'Board',
  卡片标题: 'Card title',
  '接下来想完成什么？': 'What would you like to do next?',
  描述: 'Description',
  '补充细节、链接或想法…': 'Add details, links, or ideas…',
  优先级: 'Priority',
  不设置: 'None',
  低: 'Low',
  高: 'High',
  截止日期: 'Due date',
  截止时间: 'Due time',
  主要标签: 'Primary label',
  次要标签: 'Secondary label',
  可选: 'Optional',
  保存卡片: 'Save card',
  卡片详情: 'Card details',
  未关联看板: 'Unassigned board',
  状态: 'Status',
  已完成: 'Completed',
  待完成: 'To do',
  未设置: 'Not set',
  截止: 'Due',
  创建于: 'Created',
  旧数据未记录: 'Not recorded in legacy data',
  常规: 'General',
  卡片: 'Cards',
  搜索: 'Search',
  时钟: 'Clock',
  '导入 / 导出': 'Import / Export',
  关于: 'About',
  完成提示音: 'Completion sound',
  完成卡片时播放轻提示音: 'Play a short sound when a card is completed',
  允许隐藏看板: 'Allow hiding boards',
  隐藏的看板可随时重新显示: 'Hidden boards can be shown again at any time',
  隐藏描述: 'Hide descriptions',
  只在详情中显示卡片描述: 'Show card descriptions only in details',
  简化链接显示: 'Shorten displayed links',
  省略网址中的协议前缀: 'Omit the protocol from displayed URLs',
  已完成卡片变暗: 'Dim completed cards',
  让未完成的事项更突出: 'Make unfinished tasks stand out',
  隐藏已完成卡片: 'Hide completed cards',
  '完成项移至底部，可临时显示': 'Move completed cards to the bottom; show them temporarily',
  紧凑模式: 'Compact mode',
  '显示标题，点击查看详情': 'Show titles only; click to see details',
  '隐藏 Google': 'Hide Google',
  '隐藏 Bing': 'Hide Bing',
  '隐藏 DuckDuckGo': 'Hide DuckDuckGo',
  '隐藏 YouTube': 'Hide YouTube',
  显示时钟: 'Show clock',
  在新标签页显示日期和时间: 'Show date and time on the new tab page',
  '24 小时制': '24-hour time',
  固定时钟: 'Pin clock',
  关闭后在打开页面数秒后收起: 'When off, hide the clock a few seconds after opening',
  关闭设置: 'Close settings',
  设置分类: 'Settings categories',
  '0.3.0 · 本地优先的开源新标签页待办': '0.3.0 · Local-first open-source new tab to-do',
  '熟悉的看板交互，可带走的数据。独立实现，与 NewTabTodo 原作者无关联。':
    'Familiar boards and portable data. Independently built and unaffiliated with the NewTabTodo author.',
  '无账号、无统计上传、无跨设备自动同步。卸载前请导出完整备份。':
    'No account, telemetry, or automatic cross-device sync. Export a full backup before uninstalling.',
  '源码、更新与问题反馈 ↗': 'Source, updates, and feedback ↗',
  关闭常用链接: 'Close quick links',
  '把经常访问的地方，放在触手可及的位置。': 'Keep your favorite places close at hand.',
  '无效地址，已保留原数据': 'Invalid URL; original data was kept',
  添加你的第一个常用链接: 'Add your first quick link',
  '链接表单无效，请重新填写': 'The link form is invalid. Fill it in again.',
  链接名称: 'Link name',
  '例如：GitHub': 'For example: GitHub',
  网址: 'URL',
  添加链接: 'Add link',
  让数据随时可以带走: 'Take your data with you',
  '文件只在本机处理。兼容 NewTabTodo 导出文件，导入前先检查内容。':
    'Files are handled locally. Preview NewTabTodo exports before importing.',
  导出完整备份: 'Export full backup',
  导出原版格式: 'Export legacy format',
  '完整备份包含设置、界面语言和主题；原版格式仅包含看板、卡片与常用链接，不保证旧插件自身的导入缺陷已解决。':
    'A full backup includes preferences, interface language, and theme. Legacy format contains boards, cards, and quick links; it cannot fix problems in the original importer.',
  '选择 JSON 文件': 'Choose JSON file',
  '最大 5 MiB · 预览不会修改当前数据': 'Maximum 5 MiB · Preview does not change your data',
  导入预览: 'Import preview',
  看板: 'Boards',
  链接: 'Links',
  恢复未列入顺序的看板: 'Show boards missing from display order',
  未命名: 'Untitled',
  将未关联的卡片恢复到新看板: 'Recover unassigned cards to a new board',
  导入方式: 'Import mode',
  '合并：相同内容跳过，冲突时停止': 'Merge: skip identical content; stop on conflicts',
  '替换：以文件为准，先保存恢复点': 'Replace: use file data and save a recovery point first',
  '作为副本：保留当前内容并新增': 'Copy: keep current data and add imported copies',
  我确认替换当前数据: 'I confirm replacing current data',
  '预览后数据发生了变化，请重新选择文件。':
    'Data changed after the preview. Select the file again.',
  确认导入: 'Confirm import',
  导入已保存: 'Import saved',
  本机恢复点: 'Local recovery points',
  '保留最近 3 次导入、恢复或清空前的数据。它们与扩展保存在同一台电脑，不能替代导出的备份文件。':
    'The three latest pre-import, pre-restore, or pre-clear states are kept on this computer. They do not replace exported backups.',
  还没有恢复点: 'No recovery points yet',
  恢复备份: 'Restore backup',
  '将替换当前数据，并保留恢复前的数据。':
    'This replaces current data and keeps a recovery point for the previous state.',
  确认恢复: 'Confirm restore',
  恢复此备份: 'Restore this backup',
  '清空看板、卡片和常用链接，保留设置，并建立恢复点。':
    'Clear boards, cards, and quick links while keeping preferences and creating a recovery point.',
  清空数据: 'Clear data',
  '确认清空当前看板、卡片和常用链接？': 'Clear all current boards, cards, and quick links?',
  确认清空: 'Confirm clear',
  清空当前数据: 'Clear current data',
} as const;
const zh: Partial<Record<keyof typeof en, string>> = {
  'home.boards': '我的看板',
  'home.completedCount': '{done} / {total} 已完成',
  'app.dragCard': '拖动卡片：{title}',
  'app.dragBoard': '拖动看板：{title}',
  'app.deleteCardQuestion': '删除“{title}”？',
  'app.deleteBoardQuestion': '删除“{title}”及其 {count} 张卡片？',
  'app.deleteLink': '删除链接 {name}',
  'app.recoveredBoardNames': '{names}。不勾选也会保留数据；原有隐藏状态不变。',
  'app.backupCardCount': '{count} 张卡片',
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
    'bookmark.invalidForm': 'The link form is invalid. Fill it in again.',
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
  const template = language === 'zh-CN' ? (zh[key] ?? key) : en[key];
  const formattedValues = { ...values };
  if (language === 'en' && (key === 'app.deleteBoardQuestion' || key === 'app.backupCardCount'))
    formattedValues.plural = Number(values?.count) === 1 ? '' : 's';
  return interpolate(template, formattedValues);
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

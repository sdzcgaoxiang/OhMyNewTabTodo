import React, { createContext, useContext } from 'react';
import { translate } from './i18n.ts';
import type { TranslationKey } from './i18n.ts';
import type { Language } from './types.ts';

const LanguageContext = createContext<Language>('en');

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Language {
  return useContext(LanguageContext);
}

export function useT(): (key: TranslationKey, values?: Record<string, string | number>) => string {
  const language = useLanguage();
  return (key, values) => translate(language, key, values);
}

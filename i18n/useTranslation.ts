import { useCallback } from 'react';
import { useStyleStore } from '@/store/useStyleStore';
import { createTranslator, Locale, TranslationPath } from './index';

/**
 * React hook for accessing translations based on current language
 * @returns Translation function and current locale
 */
export function useTranslation() {
  const { language } = useStyleStore();

  const translate = useCallback(
    (path: TranslationPath) => {
      return createTranslator(language as Locale)(path);
    },
    [language]
  );

  return {
    t: translate,
    locale: language,
  };
}

export default useTranslation; 
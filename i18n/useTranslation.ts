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
    (path: TranslationPath, templateParams?: Record<string, string>) => {
      return createTranslator(language as Locale)(path, templateParams);
    },
    [language]
  );

  return {
    t: translate,
    locale: language,
  };
}

export default useTranslation; 
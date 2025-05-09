export const BOOK_FORMAT = {
  EPUB: 'epub',
  EPUBZIP: 'epub+zip',
  // MD: 'md',
  // TXT: 'txt'
} as const;


export const COMMON_LANGUAGES = [
  { code: 'zh', name: '中文' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
];
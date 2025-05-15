export const BOOK_MIME_TYPE = {
  EPUB: 'application/epub+zip',
  TXT: 'text/plain',
  MD: 'text/markdown',
} as const;

export const BOOK_FORMAT = {
  EPUB: 'epub',
  TXT: 'txt',
  MD: 'md',
} as const;

export const COMMON_LANGUAGES = [
  { code: 'zh', name: '中文' },
  { code: 'zh-Hans', name: '简体中文' },
  { code: 'zh-Hant', name: '繁體中文' },
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
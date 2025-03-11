import { BOOK_FORMAT } from '@/constants/book';

export type BOOK_FORMAT_TYPE = typeof BOOK_FORMAT[keyof typeof BOOK_FORMAT];

export interface Resource {
  data: string;    // base64
  mediaType: string;
}

export interface Metadata {
  title: string; // 书名
  author?: string; // 作者
  publisher?: string; // 出版社
  date?: string; // 出版日期
  rights?: string; // 版权信息
  identifier: string; // 图书唯一标识符
  language: string; // 语言代码
  cover?: Resource;
  [key: string]: string | undefined | Resource;
}

export interface FormattedBook {
  metadata: Metadata
  chapterList: PlainTextChapter[]
}

export interface PlainTextChapter {
  title: string;
  lines: string[];
}
interface TocItem {
  title: string;
  index: number;
}
interface ReadingProgress {
  chapterIndex: number;
  offset: number;
  timestamp: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  fileHash: string;
  createTime: number;
  lastReadTime?: number;
  chapterList: PlainTextChapter[];
  toc: TocItem[];
  readingProgress?: ReadingProgress;
  metadata: Metadata;
}
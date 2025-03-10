import { BOOK_FORMAT } from '@/constants/book';

export type BOOK_FORMAT_TYPE = typeof BOOK_FORMAT[keyof typeof BOOK_FORMAT];

export interface Metadata {
  title: string; // 书名
  author?: string; // 作者
  publisher?: string; // 出版社
  date?: string; // 出版日期
  rights?: string; // 版权信息
  identifier: string; // 图书唯一标识符
  language?: string; // 语言代码
  [key: string]: string | number | boolean | undefined; // 其他元数据
}

export interface FormattedBook {
  metadata: Metadata
  chapterList: ChapterBody[]
}

export interface ChapterBody {
  title: string;
  lines: string[];
}

export interface Book {
  id: string;                 // UUID
  fileHash: string;           // 文件hash
  title: string;              // 书名 
  format: BOOK_FORMAT_TYPE;           // 文件格式
  author?: string;            // 作者
  cover?: string;             // 封面图片 (base64/blob URL)
  fileSize: number;           // 文件大小(bytes)
  createTime: number;         // 导入时间
  lastReadTime?: number;      // 最后阅读时间
  fileContent: string;        // 文件内容（文本格式或Base64编码的二进制）
  metadata: {                 // 元数据，方便扩展
    isbn?: string;            // 国际标准书号
    publisher?: string;       // 出版社
    publishDate?: string;     // 出版日期
    [key: string]: string | number | boolean | undefined; // 其他元数据
  }
}
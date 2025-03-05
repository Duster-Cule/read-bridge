export interface Book {
  id: string;                 // UUID
  fileHash: string;           // 文件hash
  title: string;              // 书名 
  author?: string;            // 作者
  cover?: string;             // 封面图片 (base64/blob URL)
  format: 'txt' | 'epub' | 'md'; // 原始格式
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
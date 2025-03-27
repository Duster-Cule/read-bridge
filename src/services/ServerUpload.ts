// import crypto from 'crypto';

import { BOOK_FORMAT } from '@/src/constants/book';
import type { BOOK_FORMAT_TYPE } from '@/src/types/book';
import { UPLOAD_CONFIG } from '@/src/constants/upload';

import { processBook } from '@/src/services/BookService';

/**
 * 处理上传的书籍文件
 * @param file 文件数据（Buffer）
 * @param fileName 文件名
 * @param fileType 文件类型 (MIME类型，如 'application/epub+zip')
 * @returns 处理后的书籍对象
 * @throws 如果文件格式无效、文件过大或处理过程中出错
 */
export async function handleFileUpload(
  file: File
) {
  if (!file) {
    throw new Error('No file uploaded');
  }
  const { name, size, type } = file
  const format = type.split('/')[1];

  if (!isValidBookFormat(format)) {
    throw new Error('Invalid file format');
  }

  if (size > UPLOAD_CONFIG.MAX_SIZE) {
    throw new Error('File size too large');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 替换 Node.js 的 crypto 哈希计算
  // const hash = crypto.createHash('sha256').update(buffer).digest('hex')
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const nameWithoutExt = name.replace(/\.[^/.]+$/, '');

  // 进行书籍初始化
  try {
    const book = await processBook(buffer, format, nameWithoutExt, hash);
    return book;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

function isValidBookFormat(format: string): format is BOOK_FORMAT_TYPE {
  return Object.values(BOOK_FORMAT).includes(format as BOOK_FORMAT_TYPE);
} 
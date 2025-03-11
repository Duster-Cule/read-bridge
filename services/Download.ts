import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * 保存文件到系统下载目录
 * @param {string} content - 要保存的文件内容
 * @param {string} filename - 文件名（包含扩展名）
 * @returns {Promise<string>} 保存后的文件完整路径
 * @throws {Error} 当下载目录不存在或写入失败时抛出错误
 */
export async function saveToFile(content: string, filename: string): Promise<string> {
  try {
    console.log(content, filename)
    const downloadDir = path.join(os.homedir(), 'Downloads');
    const filePath = path.join(downloadDir, filename);

    console.log('Saving to:', filePath);  // 打印保存路径

    // 检查目录是否存在
    if (!fs.existsSync(downloadDir)) {
      console.log('Downloads directory not found:', downloadDir);
      throw new Error(`Downloads directory not found: ${downloadDir}`);
    }

    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log('File saved successfully');

    return filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}
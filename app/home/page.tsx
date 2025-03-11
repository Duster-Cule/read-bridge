
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { BOOK_FORMAT } from '@/constants/book';
import db from '@/services/DB';
import { Book } from '@/types/book';
const { Dragger } = Upload;
export default function Home() {

  return (
    <div>
      <Dragger {...props}>

      </Dragger>
    </div>
  );
}
const props: UploadProps = {
  name: 'file',
  multiple: true,
  action: '/api/upload',
  maxCount: 1,
  accept: Object.values(BOOK_FORMAT).map(format => `.${format}`).join(','),
  onChange: async (info) => {
    const { status, response } = info.file;
    if (status === 'error') return message.error(`${info.file.name} 文件导入失败， ${response.error}`);
    else if (status === 'done') {
      try {
        const id = await db.addBook(response as Book)
        message.success(`${info.file.name} ${id} 文件导入 成功`);
      } catch (error) {
        if (error instanceof Error) message.error(`${info.file.name} 文件导入失败: ${error.message}`);
        else message.error(`${info.file.name} 文件导入失败`);
      }
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};
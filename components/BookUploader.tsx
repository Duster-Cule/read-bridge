import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { BOOK_FORMAT } from '@/constants/book';
import db from '@/services/DB';
import { Book } from '@/types/book';

const { Dragger } = Upload;

const props: UploadProps = {
  name: 'file',
  multiple: true,
  action: '/api/upload',
  maxCount: 1,
  showUploadList: false,
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

export default function BookUploader() {
  return (
    <div className="w-[100%] h-[100%]">
      <Dragger {...props} className="h-full flex items-center justify-center bg-[var(--ant-color-bg-elevated)] dark:bg-[var(--ant-color-bg-elevated)] rounded-lg hover:bg-[var(--ant-color-fill-tertiary)] dark:hover:bg-[var(--ant-color-fill-tertiary)] transition-colors">
        <PlusOutlined className="text-3xl text-[var(--ant-color-text-tertiary)]" />
      </Dragger>
    </div>
  );
} 
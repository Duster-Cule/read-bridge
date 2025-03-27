import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { BOOK_FORMAT } from '@/constants/book';
import db from '@/services/DB';
import { Book } from '@/types/book';
import { handleFileUpload } from '@/services/ServerUpload';

const { Dragger } = Upload;
function checkFileFormat(file: File): boolean {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return Object.values(BOOK_FORMAT).some(
    format => format.toLowerCase() === fileExtension
  );
}
function showError(fileNames: string) {
  message.error(`${fileNames} 格式不支持，请上传 ${Object.values(BOOK_FORMAT).join('/')} 格式的文件`);
}
const props: UploadProps = {
  name: 'file',
  multiple: true,
  action: '',
  maxCount: 1,
  showUploadList: false,
  customRequest: async (options) => {
    const { file } = options;
    const result = await handleFileUpload(file as File);
    options.onSuccess?.(result);
  },
  accept: Object.values(BOOK_FORMAT).map(format => `.${format}`).join(','),

  beforeUpload: (file) => {
    const isAcceptedFormat = checkFileFormat(file);

    if (!isAcceptedFormat) {
      showError(file.name)
      return Upload.LIST_IGNORE;
    }

    return true;
  },
  onDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    const invalidFiles = files.filter(file => !checkFileFormat(file));

    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(file => file.name).join(', ');
      showError(fileNames)
    }
  },
  onChange: async (info) => {
    const { status, response } = info.file;
    if (status === 'error') return message.error(`${info.file.name} 文件导入失败， ${response.error}`);
    else if (status === 'done') {
      try {
        const id = await db.addBook(response as Book)
        await db.addReadingProgress(id)
        message.success(`${info.file.name} ${id} 文件导入 成功`);
      } catch (error) {
        if (error instanceof Error) message.error(`${info.file.name} 文件导入失败: ${error.message}`);
        else message.error(`${info.file.name} 文件导入失败`);
      }
    }
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
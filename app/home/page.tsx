import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { BOOK_FORMAT } from '@/constants/book';
const { Dragger } = Upload;
export default function Home() {

  return (
    <div>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload. Strictly prohibited from uploading company data or other
          banned files.
        </p>
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
  beforeUpload: (file) => {
    // 可以在这里做文件验证
    console.log('File:', file);
    return true; // 返回 true 继续上传
  },
  onChange(info) {
    const { status } = info.file;
    if (status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
      // 这里可以处理上传成功后的响应
      console.log('Response:', info.file.response);
    } else if (status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};
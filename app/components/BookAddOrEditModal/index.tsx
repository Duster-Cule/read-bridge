import { Book } from "@/types/book";
import { Modal, Form, Input, Divider, Space, Upload, Button, Row, Col, Select } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { COMMON_LANGUAGES } from "@/constants/book";
const { Option } = Select;

interface BookAddOrEditModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (book: Book) => void;
  getInitialData: () => Book;
  type: 'add' | 'edit';
}

export default function BookAddOrEditModal({ open, onCancel, onOk, getInitialData, type }: BookAddOrEditModalProps) {
  const { t } = useTranslation();
  const [book, setBook] = useState<Book>();
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return
    const initialData = getInitialData();
    setBook(initialData);
    form.setFieldsValue({
      title: initialData.metadata.title,
      author: initialData.metadata.author,
      publisher: initialData.metadata.publisher,
      date: initialData.metadata.date,
      rights: initialData.metadata.rights,
      identifier: initialData.metadata.identifier,
      language: initialData.metadata.language,
    });
  }, [open, getInitialData, setBook, form]);

  const handleFormChange = () => {
    const formValues = form.getFieldsValue();
    if (book) {
      setBook({
        ...book,
        title: formValues.title,
        author: formValues.author,
        metadata: {
          ...book.metadata,
          ...formValues
        }
      });
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (book && reader.result) {
          const coverData = reader.result.toString();
          setBook({
            ...book,
            metadata: {
              ...book.metadata,
              cover: {
                data: coverData.split(',')[1],
                mediaType: file.type
              }
            }
          });
        }
      };
      return false;
    }
  };

  const handleSubmit = useCallback(() => {
    form.validateFields().then(() => {
      onOk(book as Book);
    });
  }, [form, onOk, book]);

  return <Modal
    className="h-[700px]"
    width={900}
    open={open}
    onCancel={onCancel}
    onOk={handleSubmit}
    okText="确定"
    cancelText="取消"
  >
    <h1 className="font-bold text-xl mb-2">
      {type === 'add' ? "添加图书" : "编辑图书"}
    </h1>
    <div className="w-full h-[600px] overflow-y-auto px-4">
      <Row gutter={24}>
        {/* 左侧封面展示与上传 */}
        <Col span={8}>
          <div className="flex-1 flex flex-col items-center justify-center">
            {book?.metadata.cover ? (
              <div className="relative mb-4 w-full">
                <div className="max-w-full overflow-hidden rounded-lg shadow-md mx-auto" style={{ maxHeight: '330px' }}>
                  <img
                    src={`data:${book.metadata.cover.mediaType};base64,${book.metadata.cover.data}`}
                    alt="Book cover"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                style={{ width: '200px', height: '280px' }}>
                <p className="text-gray-500">暂无封面</p>
              </div>
            )}

            <Upload {...uploadProps} showUploadList={false}>
              <Space>
                <Button type="primary" icon={<UploadOutlined />}>
                  {book?.metadata.cover ? "更换封面" : "上传封面"}
                </Button>
                {book?.metadata.cover && (
                  <Button
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      if (book) {
                        const newMetadata = { ...book.metadata };
                        delete newMetadata.cover;
                        setBook({ ...book, metadata: newMetadata });
                      }
                    }}
                  >
                    移除封面
                  </Button>
                )}
              </Space>
            </Upload>
          </div>

        </Col>
        {/* 右侧元数据表单 */}
        <Col span={16}>

          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
            requiredMark="optional"
          >
            <Form.Item
              name="title"
              label="书名"
              rules={[{ required: true, message: "请输入书名" }]}
            >
              <Input placeholder="请输入书名" />
            </Form.Item>

            <Form.Item
              name="author"
              label="作者"
            >
              <Input placeholder="请输入作者" />
            </Form.Item>

            <Form.Item
              name="publisher"
              label="出版社"
            >
              <Input placeholder="请输入出版社" />
            </Form.Item>

            <Form.Item
              name="date"
              label="出版日期"
            >
              <Input placeholder="请输入出版日期" />
            </Form.Item>


            <Form.Item
              name="language"
              label="语言代码"
              rules={[{ required: true, message: "请选择语言代码" }]}
            >
              <Select
                placeholder="请选择语言"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {COMMON_LANGUAGES.map(lang => (
                  <Option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

        </Col>

      </Row>

      <Divider style={{ margin: '24px 0' }} />

      {/* 下方章节编辑部分 */}
      <div className="chapters-list">

      </div>

    </div>
  </Modal>;
}


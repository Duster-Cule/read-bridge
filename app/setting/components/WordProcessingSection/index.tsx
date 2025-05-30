import { useMemo, useState } from "react";
import { Card } from "../index";
import { Button, Modal, Form, Input, Select, Popconfirm, List, Typography, Space, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { useOutputOptions } from "@/store/useOutputOptions";
import { WordOption } from "@/types/llm";
import TextArea from "antd/es/input/TextArea";
import { useTranslation } from "@/i18n/useTranslation";

export default function WordProcessingSection() {
  const { t } = useTranslation()
  const { wordOptions, addWordOptions, updateWordOptions, deleteWordOptions, resetWordOptions, selectedWordId, setSelectedWordId } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentOption, setCurrentOption] = useState<WordOption | null>(null);
  const [form] = Form.useForm<WordOption>();

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentOption(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: WordOption) => {
    setIsEdit(true);
    setCurrentOption(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record: WordOption) => {
    deleteWordOptions(record);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentOption) {
        updateWordOptions({
          ...values,
          id: currentOption.id,
        });
      } else {
        addWordOptions(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  return (
    <Card>
      <div className="flex flex-col">
        <List
          dataSource={wordOptions}
          rowKey="id"
          renderItem={(item: WordOption) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(item)}
                  key="edit"
                />,
                <Popconfirm
                  title={t('settings.deleteWordProcessing')}
                  description={t('common.templates.confirmDelete', { entity: t('common.entities.wordConfigAsObject') })}
                  onConfirm={() => handleDelete(item)}
                  okText={t('common.ok')}
                  cancelText={t('common.cancel')}
                  key="delete"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Typography.Paragraph ellipsis={{ rows: 2 }}>{item.rulePrompt.substring(0, 100)}...</Typography.Paragraph>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <div className="flex justify-end items-center mt-4 gap-2">
          <Tooltip title={t('settings.wordProcessingSelectionTooltip')} placement="left">
            <Select
              className="w-48"
              value={selectedWordId}
              onChange={setSelectedWordId}
              options={wordOptions.map(option => ({ value: option.id, label: option.name }))}
            />
          </Tooltip>
          <Button
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {t('settings.addWordConfig')}
          </Button>
          <Popconfirm
            title={t('settings.resetWordConfig')}
            description={t('settings.resetWordConfigDescription')}
            onConfirm={resetWordOptions}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
          >
            <Button icon={<ReloadOutlined />}>{t('common.reset')}</Button>
          </Popconfirm>
        </div>
      </div>

      <Modal
        title={isEdit ? t('settings.editWordConfig') : t('settings.addWordConfig')}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
        okText={t('common.ok')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.wordConfigName')}
            rules={[{ required: true, message: t('common.templates.pleaseEnter', { field: t('common.entities.wordConfigName') }) }]}
          >
            <Input placeholder={t('settings.wordConfigName')} />
          </Form.Item>

          <Form.Item
            name="rulePrompt"
            label={t('settings.wordConfigPrompt')}
            rules={[{ required: true, message: t('common.templates.pleaseEnter', { field: t('common.entities.wordConfigPrompt') }) }]}
          >
            <TextArea
              placeholder={t('settings.wordConfigPrompt')}
              autoSize={{ minRows: 5, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

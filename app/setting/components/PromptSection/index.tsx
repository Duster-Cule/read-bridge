import { Card } from "../index";
import { useOutputOptions } from "@/store/useOutputOptions";
import { Button, Modal, Form, Input, Typography, List, FormInstance, Popconfirm } from 'antd';
import { useState } from "react";
import { PromptOption } from "@/types/llm";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from "@/i18n/useTranslation";
const { Paragraph } = Typography;

export default function PromptSection() {
  const { t } = useTranslation();
  const { promptOptions, addPromptOptions, updatePromptOptions, deletePromptOptions, resetPromptOptions } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form] = Form.useForm<PromptOption>();

  const showModal = () => {
    setIsModalOpen(true);
  };


  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        updatePromptOptions(values);
      } else {
        addPromptOptions(values);
      }
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEdit(false);
    setIsModalOpen(false);
  };

  const handleEdit = (item: PromptOption) => {
    form.setFieldsValue(item);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleDelete = (item: PromptOption) => {
    deletePromptOptions(item);
  };



  return (
    <Card className="flex flex-col color-[var(--color-text-primary)]">
      <List
        itemLayout="horizontal"
        dataSource={promptOptions}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} key="list-edit">{t('common.edit')}</Button>,
              <Popconfirm
                key="list-delete-confirm"
                title={t('settings.deletePrompt')}
                description={t('common.templates.confirmDelete', { entity: t('common.entities.promptAsObject') })}
                onConfirm={() => handleDelete(item)}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
              >
                <Button type="text" danger icon={<DeleteOutlined />} key="list-delete">{t('common.delete')}</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={<div className="text-lg font-bold">{item.name}</div>}
              description={<ExpandableDescription text={item.prompt} maxLength={100} />}
            />
          </List.Item>
        )}
      />
      <div className="w-full flex justify-end mb-1 gap-2">
        <Button icon={<PlusOutlined />} onClick={showModal}>{t('settings.addPrompt')}</Button>
        <Popconfirm
          title={t('settings.resetPrompt')}
          description={t('settings.resetPromptDescription')}
          onConfirm={resetPromptOptions}
          okText={t('common.ok')}
          cancelText={t('common.cancel')}
        >
          <Button icon={<ReloadOutlined />}>{t('common.reset')}</Button>
        </Popconfirm>
      </div>
      <PromptModal isModalOpen={isModalOpen} handleOk={handleOk} handleCancel={handleCancel} form={form} isEdit={isEdit} />
    </Card >
  );
}

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

function ExpandableDescription({ text, maxLength = 100 }: ExpandableDescriptionProps) {
  const { t } = useTranslation();
  if (!text) text = t('settings.noPrompt');
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text.length > maxLength;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Paragraph ellipsis={isTruncated && !expanded ? { rows: 1, expandable: false, symbol: '' } : false}>
        {text}
      </Paragraph>
      {isTruncated && (
        <Button type="link" onClick={toggleExpanded} style={{ padding: 0 }}>
          {expanded ? t('common.collapse') : t('common.expand')}
        </Button>
      )}
    </div>
  );
}

function PromptModal({ isModalOpen, handleOk, handleCancel, form, isEdit = false }: { isModalOpen: boolean, handleOk: () => void, handleCancel: () => void, form: FormInstance<PromptOption>, isEdit?: boolean }) {
  const { t } = useTranslation();
  return <Modal title={isEdit ? t('settings.editPrompt') : t('settings.addPrompt')} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} destroyOnClose okText={t('common.ok')} cancelText={t('common.cancel')}>
    <Form form={form} layout="vertical" name="add_prompt_form">
      <Form.Item
        name="name"
        label={t('settings.promptName')}
        rules={[{ required: true, message: t('common.templates.pleaseEnter', { field: t('common.entities.promptName') }) }]}
      >
        <Input placeholder={t('settings.promptName')} />
      </Form.Item>
      <Form.Item
        name="prompt"
        label={t('settings.promptContent')}
      >
        <Input.TextArea rows={4} placeholder={t('settings.promptContent')} />
      </Form.Item>
    </Form>
  </Modal>
}


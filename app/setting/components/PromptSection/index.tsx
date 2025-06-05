import { Card } from "../index";
import { useOutputOptions } from "@/store/useOutputOptions";
import { Button, Modal, Form, Input, Typography, List, FormInstance, Popconfirm, message, Space } from 'antd';
import { useState, useEffect } from "react";
import { PromptOption } from "@/types/llm";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from "@/i18n/useTranslation";
import { useSiderStore } from "@/store/useSiderStore";
import KeyboardShortcut from "@/app/components/KeyboardShortcut";
const { Paragraph } = Typography;

export default function PromptSection() {
  const { t } = useTranslation();
  const { promptOptions, addPromptOptions, updatePromptOptions, deletePromptOptions, resetPromptOptions } = useOutputOptions();
  const { chatShortcut, setChatShortcut } = useSiderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [form] = Form.useForm<PromptOption>();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const showShortcutModal = () => {
    setIsShortcutModalOpen(true);
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
        <Button icon={<SettingOutlined />} onClick={showShortcutModal}>
          <span className="flex items-center gap-2">
            {t('settings.shortcutSettings')}
            <KeyboardShortcut shortcut={chatShortcut} />
          </span>
        </Button>
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
      <ShortcutModal
        isModalOpen={isShortcutModalOpen}
        onCancel={() => setIsShortcutModalOpen(false)}
        currentShortcut={chatShortcut}
        onSave={setChatShortcut}
      />
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

function ShortcutModal({ isModalOpen, onCancel, currentShortcut, onSave }: { isModalOpen: boolean, onCancel: () => void, currentShortcut: string, onSave: (shortcut: string) => void }) {
  const { t } = useTranslation();
  const [recordedShortcut, setRecordedShortcut] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedShortcut('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleClear = () => {
    setRecordedShortcut('');
  };

  const handleSave = () => {
    if (recordedShortcut) {
      onSave(recordedShortcut);
      message.success(t('settings.shortcutSaved'));
      onCancel();
    } else {
      message.warning(t('settings.pleaseRecordShortcut'));
    }
  };

  const handleCancel = () => {
    setRecordedShortcut('');
    setIsRecording(false);
    onCancel();
  };

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Esc键退出录制
      if (event.key === 'Escape') {
        setIsRecording(false);
        return;
      }

      const keys: string[] = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.altKey) keys.push('Alt');
      if (event.shiftKey) keys.push('Shift');

      // 过滤修饰键本身
      const key = event.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        // 转换特殊键名
        let displayKey = key;
        if (key === ' ') displayKey = 'Space';
        else if (key === 'Enter') displayKey = 'Enter';
        else if (key === 'Tab') displayKey = 'Tab';
        else if (key.length === 1) displayKey = key.toUpperCase();
        else displayKey = key; // 保持其他特殊键的原始名称

        keys.push(displayKey);

        if (keys.length > 1) { // 至少需要一个修饰键
          const shortcut = keys.join('+');
          setRecordedShortcut(shortcut);
          setIsRecording(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRecording]);

  return (
    <Modal
      title={t('settings.shortcutSettings')}
      open={isModalOpen}
      onCancel={handleCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={handleCancel}>{t('common.cancel')}</Button>,
        <Button key="save" type="primary" onClick={handleSave} disabled={!recordedShortcut}>
          {t('common.ok')}
        </Button>
      ]}
      width={500}
    >
      <div className="space-y-4">
        <div>
          <div className="text-sm  mb-2">{t('settings.currentShortcut')}</div>
          <div className="p-3 rounded border border-[var(--ant-color-border)]">
            <KeyboardShortcut shortcut={currentShortcut} />
          </div>
        </div>

        <div>
          <div className="text-sm mb-2">{t('settings.newShortcut')}</div>
          <div className="p-3 rounded border border-[var(--ant-color-border)] min-h-[40px] flex items-center">
            {recordedShortcut ? (
              <KeyboardShortcut shortcut={recordedShortcut} />
            ) : (
              <span className="text-gray-400">
                {isRecording ? t('settings.shortcutRecording') : t('settings.shortcutRecordingPlaceholder')}
              </span>
            )}
          </div>
        </div>

        <Space>
          <Button
            type={isRecording ? "default" : "primary"}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? t('settings.stopRecording') : t('settings.startRecording')}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={!recordedShortcut}
          >
            {t('settings.clear')}
          </Button>
        </Space>

        <div className="text-xs text-gray-500 mt-4">
          <div>{t('settings.shortcutTips')}</div>
          <div>{t('settings.shortcutTip1')}</div>
          <div>{t('settings.shortcutTip2')}</div>
          <div>{t('settings.shortcutTip3')}</div>
        </div>
      </div>
    </Modal>
  );
}

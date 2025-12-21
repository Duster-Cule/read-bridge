import { useState, useMemo } from 'react'
import { Button, Space, Switch, Popconfirm, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useContextMenuStore } from '@/store/useContextMenuStore'
import { useLLMStore } from '@/store/useLLMStore'
import { ContextMenuItem } from '@/types/contextMenu'
import Card from '../Card'
import { useTranslation } from '@/i18n/useTranslation'

const { TextArea } = Input

export default function ContextMenuSection() {
  const { t } = useTranslation()
  const { items, addItem, editItem, deleteItem, toggleItem } = useContextMenuStore()
  const providers = useLLMStore(state => state.providers)
  const getModels = useLLMStore(state => state.models)
  const models = useMemo(() => getModels(), [providers, getModels])
  const [modalVisible, setModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ContextMenuItem | null>(null)
  const [form] = Form.useForm()

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (item: ContextMenuItem) => {
    setCurrentItem(item)
    form.setFieldsValue({ ...item, modelId: item.modelId || '' })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const item: ContextMenuItem = {
        id: currentItem?.id || '',
        ...values,
        modelId: values.modelId || null,
      }

      if (currentItem) {
        editItem(item)
      } else {
        // 新增项会通过addItem创建ID
        addItem()
        const newItems = useContextMenuStore.getState().items
        const newItem = newItems[newItems.length - 1]
        editItem({ ...newItem, ...values })
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{t('settings.contextMenu')}</h3>
          <p className="text-sm text-gray-500">{t('settings.contextMenuDesc')}</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t('settings.addMenuItem')}
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{item.name}</span>
                {item.modelId && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {models.find(m => m.id === item.modelId)?.name || item.modelId}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate max-w-xl">
                {item.prompt}
              </div>
            </div>
            <Space>
              <Switch
                checked={item.enabled}
                onChange={() => toggleItem(item.id)}
              />
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(item)}
              />
              <Popconfirm
                title={t('common.templates.confirmDelete', { entity: t('contextMenu.menuItem') })}
                onConfirm={() => deleteItem(item.id)}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
              >
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            </Space>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {t('settings.noContextMenuItems')}
          </div>
        )}
      </Space>

      <Modal
        title={currentItem ? t('settings.editMenuItem') : t('settings.addMenuItem')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('settings.menuItemName')}
            rules={[{ required: true, message: t('settings.pleaseEnterName') }]}
          >
            <Input placeholder={t('settings.menuItemNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="prompt"
            label={t('settings.menuItemPrompt')}
            tooltip={t('settings.menuItemPromptTooltip')}
            rules={[{ required: true, message: t('settings.pleaseEnterPrompt') }]}
          >
            <TextArea
              rows={6}
              placeholder={t('settings.menuItemPromptPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="modelId"
            label={t('settings.menuItemModel')}
            tooltip={t('settings.menuItemModelTooltip')}
          >
            <Select
              allowClear
              placeholder={t('settings.useDefaultChatModel')}
              options={[
                { label: t('settings.useDefaultChatModel'), value: '' },
                ...models.map(m => ({ label: m.name, value: m.id }))
              ]}
            />
          </Form.Item>

          <Form.Item name="enabled" label={t('settings.enabled')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

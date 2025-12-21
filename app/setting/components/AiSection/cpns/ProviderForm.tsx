import { useState } from 'react';
import { App, Form, Input, Button, Typography, Space, Popconfirm, FormInstance } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Provider, Model } from '@/types/llm';
import ModelCard from './ModelCard';
import { useTranslation } from '@/i18n/useTranslation';
interface ProviderFormProps {
  provider: Provider;
  form: FormInstance<Provider>;
  onProviderUpdate: (values: Provider) => void;
  onAddModel: () => void;
  onEditModel: (model: Model) => void;
  onDeleteModel: (modelId: string) => void;
  onDeleteProvider: () => void;
  onFetchOllamaModels?: (baseUrl: string) => Promise<void>;
}

const ProviderForm = ({
  provider,
  form,
  onProviderUpdate,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onDeleteProvider,
  onFetchOllamaModels
}: ProviderFormProps) => {
  const { t } = useTranslation()
  const { message } = App.useApp();
  const [fetchingModels, setFetchingModels] = useState(false);

  const handleFetchOllamaModels = async () => {
    const baseUrl = form.getFieldValue('baseUrl') || provider.baseUrl;
    if (!baseUrl) {
      message.error(t('settings.pleaseEnterBaseURL'));
      return;
    }

    setFetchingModels(true);
    try {
      if (onFetchOllamaModels) {
        await onFetchOllamaModels(baseUrl);
      }
    } catch (error) {
      message.error(t('settings.fetchModelsFailed') + ': ' + (error as Error).message);
    } finally {
      setFetchingModels(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={4}>{provider.name}</Typography.Title>
        {!provider.isDefault && (
          <Popconfirm
            title={t('common.templates.confirmDelete', { entity: t('common.entities.providerAsObject') })}
            onConfirm={onDeleteProvider}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
          >
            <Button danger icon={<DeleteOutlined />}>{t('settings.deleteProvider')}</Button>
          </Popconfirm>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onProviderUpdate}
        onValuesChange={(_, values) => onProviderUpdate(values)}
      >
        <Form.Item name="name" label={t('settings.providerName')} rules={[{ required: true }]}>
          <Input placeholder={t('settings.providerName')} />
        </Form.Item>

        <Form.Item name="baseUrl" label={t('settings.baseURL')} tooltip={t('settings.baseURLTooltip')} rules={[{ required: true }]}>
          <Input placeholder={t('settings.baseURL')} />
        </Form.Item>

        {provider.type !== 'ollama' && (
          <Form.Item name="apiKey" label={t('settings.apiKey')} rules={[{ required: true }]}>
            <Input.Password placeholder={t('settings.apiKey')} />
          </Form.Item>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Typography.Title level={5}>{t('settings.model')}</Typography.Title>
            <Space>
              {provider.type === 'ollama' && (
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleFetchOllamaModels}
                  loading={fetchingModels}
                >
                  {t('settings.fetchModels')}
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddModel}>
                {t('settings.addModel')}
              </Button>
            </Space>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            {provider.models.map((model, index) => (
              <ModelCard
                key={`${provider.id}-${String(model.id)}-${index}`}
                model={model}
                onEdit={onEditModel}
                onDelete={onDeleteModel}
              />
            ))}
          </Space>
        </div>
      </Form>
    </>
  );
};

export default ProviderForm; 
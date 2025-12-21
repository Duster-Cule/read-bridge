import { useEffect, useMemo, useState } from 'react';
import { App, Menu, Button, Form } from 'antd';
import { Provider, Model } from '@/types/llm';
import { useLLMStore } from '@/store/useLLMStore';
import { ModelFormModal, ProviderForm } from './cpns';
import Card from '../Card';
import { useTranslation } from '@/i18n/useTranslation';

export default function AiSection() {
  const { t } = useTranslation()
  const { message } = App.useApp();
  const { providers: defaultProviders, addProvider, editProvider, deleteProvider } = useLLMStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [form] = Form.useForm();
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [currentModel, setCurrentModel] = useState<Model | undefined>(undefined);

  useEffect(() => {
    setProviders([...defaultProviders])
    if (selectedProviderId === '') {
      setSelectedProviderId(defaultProviders[0].id)
      setSelectedProvider(defaultProviders[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultProviders])

  useEffect(() => {
    if (selectedProvider) {
      form.setFieldsValue({
        name: selectedProvider.name,
        baseUrl: selectedProvider.baseUrl,
        apiKey: selectedProvider.apiKey,
      });
    }
  }, [selectedProvider, form]);

  const menuItems = useMemo(() => providers.map((provider: Provider) => ({
    key: provider.id,
    label: (
      <div className="flex flex-col justify-center">
        <span className="text-base font-medium">{provider.name}</span>
        <span className="text-sm text-gray-500">{`${provider.models.length} ${t('settings.models')}`}</span>
      </div>
    ),
  })), [providers, t]);

  const handleMenuSelect = ({ key }: { key: string }) => {
    setSelectedProviderId(key);
    setSelectedProvider(providers.find(p => p.id === key) || null)
  };

  const handleProviderUpdate = (values: Provider) => {
    if (selectedProvider) {
      const updatedProvider = {
        ...selectedProvider,
        ...values
      };
      editProvider(updatedProvider);
      setSelectedProvider(updatedProvider);
    }
  };

  const handleAddModel = () => {
    setCurrentModel(undefined);
    setModelModalVisible(true);
  };

  const handleEditModel = (model: Model) => {
    setCurrentModel(model);
    setModelModalVisible(true);
  };

  const handleModelSubmit = (model: Model) => {
    if (!selectedProvider) return;

    let updatedModels: Model[];
    if (currentModel) {
      // Edit existing model
      updatedModels = selectedProvider.models.map(m =>
        m.id === model.id ? model : m
      );
    } else {
      // Add new model
      updatedModels = [...selectedProvider.models, model];
    }

    const updatedProvider = {
      ...selectedProvider,
      models: updatedModels
    };

    editProvider(updatedProvider);
    setSelectedProvider(updatedProvider);
    setModelModalVisible(false);
  };

  const handleDeleteModel = (modelId: string) => {
    if (!selectedProvider) return;

    const updatedProvider = {
      ...selectedProvider,
      models: selectedProvider.models.filter(m => m.id !== modelId)
    };

    editProvider(updatedProvider);
    setSelectedProvider(updatedProvider);
  };

  const handleDeleteProvider = () => {
    if (selectedProvider && !selectedProvider.isDefault) {
      deleteProvider(selectedProvider.id);
      // Reset selection to first provider
      if (providers.length > 1) {
        const firstRemainingProvider = providers.find(p => p.id !== selectedProvider.id);
        if (firstRemainingProvider) {
          setSelectedProviderId(firstRemainingProvider.id);
          setSelectedProvider(firstRemainingProvider);
        }
      }
    }
  };

  const handleFetchOllamaModels = async (baseUrl: string) => {
    if (!selectedProvider) return;

    type OllamaTag = {
      name: string;
      [key: string]: unknown;
    };

    type OllamaTagsResponse = {
      models: OllamaTag[];
    };

    try {
      // 调用Ollama API获取模型列表
      const response = await fetch(`${baseUrl}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: OllamaTagsResponse = await response.json();
      
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error(t('settings.invalidResponse'));
      }

      // 转换为应用的Model格式
      const fetchedModels: Model[] = data.models.map((model) => ({
        id: model.name,
        name: model.name.split(':')[0], // 移除tag部分作为显示名称
        providerId: selectedProvider.id,
        temperature: 0.5,
        topP: 1,
      }));

      if (fetchedModels.length === 0) {
        throw new Error(t('settings.noModelsFound'));
      }

      // 覆盖Ollama模型列表：以Ollama返回为准（同时尽量保留已有同ID模型的自定义参数）
      const existingById = new Map(selectedProvider.models.map(m => [m.id, m] as const));
      const nextModels: Model[] = fetchedModels.map(m => {
        const existing = existingById.get(m.id);
        return {
          ...m,
          name: existing?.name ?? m.name,
          temperature: existing?.temperature ?? m.temperature,
          topP: existing?.topP ?? m.topP,
        };
      });

      const updatedProvider = {
        ...selectedProvider,
        models: nextModels
      };

      editProvider(updatedProvider);
      setSelectedProvider(updatedProvider);

      message.success(t('settings.fetchModelsSuccessDetail', { count: String(nextModels.length) }));
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      throw error;
    }
  };

  return (
    <Card className='h-[50vh] flex justify-between overflow-hidden'>
      <div className='w-[20%] h-full flex flex-col overflow-y-auto'>
        <Menu
          mode="vertical"
          selectedKeys={[selectedProviderId]}
          className="w-full h-40vh"
          items={menuItems}
          onClick={handleMenuSelect}
        />
        <Button className='h-[10%] mb-2' type="text" onClick={addProvider}>+</Button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {selectedProvider && (
          <ProviderForm
            provider={selectedProvider}
            form={form}
            onProviderUpdate={handleProviderUpdate}
            onAddModel={handleAddModel}
            onEditModel={handleEditModel}
            onDeleteModel={handleDeleteModel}
            onDeleteProvider={handleDeleteProvider}
            onFetchOllamaModels={handleFetchOllamaModels}
          />
        )}
      </div>

      <ModelFormModal
        visible={modelModalVisible}
        onCancel={() => setModelModalVisible(false)}
        onSubmit={handleModelSubmit}
        initialValues={currentModel}
        providerId={selectedProviderId}
      />
    </Card>
  );
}


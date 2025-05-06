import { useLLMStore } from "@/store/useLLMStore";
import { Form, Select, Empty } from "antd";
import { useEffect, useMemo, useCallback } from "react";
import Card from "../Card";
import { useTranslation } from "@/i18n/useTranslation";

export default function DefaultModelSection() {
  const { t } = useTranslation();
  const { chatModel, setChatModel, parseModel, setParseModel, providers } = useLLMStore();
  const [form] = Form.useForm();

  const configuredProviders = useMemo(() => {
    return providers.filter(provider => provider.baseUrl && provider.apiKey && provider.models.length > 0);
  }, [providers]);

  const hasModels = configuredProviders.length > 0;

  // 获取所有可用模型并按提供商分组
  const availableModelsGrouped = useMemo(() => {
    return configuredProviders.map(provider => ({
      label: provider.name,
      options: provider.models.map(model => ({
        value: model.id,
        label: `${model.name} (${model.id})`,
      }))
    }));
  }, [configuredProviders]);

  // 获取所有可用模型的平铺列表
  const availableModels = useMemo(() => {
    return configuredProviders.flatMap(provider => provider.models);
  }, [configuredProviders]);

  useEffect(() => {
    if (!hasModels) {
      if (chatModel) {
        setChatModel(null);
      }

      if (parseModel) {
        setParseModel(null);
      }

      form.resetFields();
    } else {
      form.setFieldsValue({
        chatModel: chatModel?.id,
        parseModel: parseModel?.id
      });
    }
  }, [chatModel, parseModel, hasModels, form, setChatModel, setParseModel]);

  const handleChatModelChange = useCallback((modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setChatModel(selectedModel);
    }
  }, [availableModels, setChatModel]);

  const handleParseModelChange = useCallback((modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setParseModel(selectedModel);
    }
  }, [availableModels, setParseModel]);

  const handleClearChatModel = useCallback(() => {
    setChatModel(null);
    form.setFieldValue('chatModel', undefined);
  }, [setChatModel, form]);

  const handleClearParseModel = useCallback(() => {
    setParseModel(null);
    form.setFieldValue('parseModel', undefined);
  }, [setParseModel, form]);


  return (
    <Card>
      {hasModels ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name="chatModel"
            label={t('settings.chatModel')}
            tooltip={t('settings.chatModelTooltip')}
          >
            <Select
              placeholder={t('settings.selectChatModel')}
              style={{ width: '100%' }}
              onChange={handleChatModelChange}
              onClear={handleClearChatModel}
              allowClear
              disabled={!hasModels}
              options={availableModelsGrouped}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="parseModel"
            label={t('settings.analyticalModel')}
            tooltip={t('settings.analyticalModelTooltip')}
          >
            <Select
              placeholder={t('settings.selectAnalyticalModel')}
              style={{ width: '100%' }}
              onChange={handleParseModelChange}
              onClear={handleClearParseModel}
              allowClear
              disabled={!hasModels}
              options={availableModelsGrouped}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      ) : (
        <Empty
          description={t('settings.noAvailableModel')}
          className="py-6"
        />
      )}
    </Card>
  );
}

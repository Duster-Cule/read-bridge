import { useLLMStore } from "@/store/useLLMStore";
import { Form, Select, Empty } from "antd";
import { useEffect, useMemo, useCallback } from "react";
import Card from "../Card";

export default function DefaultModelSection() {
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

  const handleClear = useCallback(() => {
    setChatModel(null);
    setParseModel(null);
    form.resetFields();
  }, [setChatModel, setParseModel, form]);

  return (
    <Card>
      {hasModels ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name="chatModel"
            label='聊天模型'
            tooltip='设置聊天区域使用的模型'
          >
            <Select
              placeholder="请选择聊天模型"
              style={{ width: '100%' }}
              onChange={handleChatModelChange}
              onClear={handleClear}
              allowClear
              disabled={!hasModels}
              options={availableModelsGrouped}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="parseModel"
            label='解析模型'
            tooltip='设置解析区域使用的模型 推荐使用非推理模型'
          >
            <Select
              placeholder="请选择解析模型"
              style={{ width: '100%' }}
              onChange={handleParseModelChange}
              onClear={handleClear}
              allowClear
              disabled={!hasModels}
              options={availableModelsGrouped}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      ) : (
        <Empty
          description="没有可用的模型。请先在模型设置中配置有效的模型"
          className="py-6"
        />
      )}
    </Card>
  );
}

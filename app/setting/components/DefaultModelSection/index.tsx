import { useLLMStore } from "@/store/useLLMStore";
import { Form, Select, Empty } from "antd";
import { useEffect, useMemo } from "react";
import Card from "../Card";

export default function DefaultModelSection() {
  const { defaultModel, setDefaultModel, providers } = useLLMStore();
  const [form] = Form.useForm();
  const configuredProviders = useMemo(() => {
    return providers.filter(provider => provider.baseUrl && provider.apiKey && provider.models.length > 0);
  }, [providers])
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
    if (!hasModels && defaultModel) {
      setDefaultModel(null);
      form.resetFields();
    } else {
      form.setFieldsValue({
        defaultModel: defaultModel?.id
      });
    }
  }, [defaultModel, hasModels, form, setDefaultModel]);

  const handleModelChange = (modelId: string) => {
    const selectedModel = availableModels.find(model => model.id === modelId);
    if (selectedModel) {
      setDefaultModel(selectedModel);
    }
  };

  // Allow clearing the default model selection
  const handleClear = () => {
    setDefaultModel(null);
    form.resetFields();
  };

  return (
    <Card>
      {hasModels ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name="defaultModel"
            label='默认模型'
            tooltip='设置系统默认使用的模型'
          >
            <Select
              placeholder="请选择默认模型"
              style={{ width: '100%' }}
              onChange={handleModelChange}
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

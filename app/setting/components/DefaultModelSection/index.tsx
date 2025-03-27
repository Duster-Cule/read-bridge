import ToolTipLabel from "@/components/ToolTipLable";
import { useLLMStore } from "@/store/useLLMStore";
import { Form, Select, Empty, theme } from "antd";
import { useEffect } from "react";

export default function DefaultModelSection() {
  const { defaultModel, setDefaultModel, models } = useLLMStore();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const availableModels = models();
  const hasModels = availableModels.length > 0;

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
    <div className="w-full p-4 border rounded-lg" style={{ borderColor: token.colorBorder }}>

      {hasModels ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name="defaultModel"
            label={ToolTipLabel("默认模型", "设置系统默认使用的模型")}
          >
            <Select
              placeholder="请选择默认模型"
              style={{ width: '100%' }}
              onChange={handleModelChange}
              onClear={handleClear}
              allowClear
              disabled={!hasModels}
              options={availableModels.map(model => ({
                value: model.id,
                label: `${model.name} (${model.id})`
              }))}
            />
          </Form.Item>
        </Form>
      ) : (
        <Empty
          description="没有可用的模型。请先在模型设置中配置有效的模型"
          className="py-6"
        />
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { Form, Input, Modal, Slider, Tooltip } from 'antd';
import { Model } from '@/src/types/llm';
import { InfoCircleOutlined, InfoOutlined } from '@ant-design/icons';

interface ModelFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (model: Model) => void;
  initialValues?: Model;
}

const ModelFormModal = ({
  visible,
  onCancel,
  onSubmit,
  initialValues
}: ModelFormModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const modelData: Model = {
        id: values.id,
        name: values.name || values.id,
        temperature: values.temperature || 0.5,
        topP: values.topP || 1
      };
      onSubmit(modelData);
      form.resetFields();
    });
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idValue = e.target.value;
    form.setFieldsValue({ name: idValue });
  };

  return (
    <Modal
      title={initialValues ? "编辑模型" : "添加模型"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="id" label={toolTip('模型ID', '例如: deepseek-chat')} rules={[{ required: true, message: '请输入模型ID' }]}>
          <Input
            placeholder="输入模型ID"
            onChange={handleIdChange}
          />
        </Form.Item>
        <Form.Item name="name" label={toolTip('模型名称', '模型名称，单纯用于显示')}>
          <Input placeholder="输入模型名称" />
        </Form.Item>
        <Form.Item name="temperature" label={toolTip('Temperature(温度)', '控制生成文本的随机性和创造性。值越高，回复越多样化但可能偏离主题，值为0时选择最可能的词，日常使用建议0.5-0.7')} >
          <Slider min={0} max={2} step={0.1} defaultValue={0.5} />
        </Form.Item>
        <Form.Item name="topP" label={toolTip('Top P(核采样)', '控制生成文本的多样性。较高的值使用更多低概率词汇，增加创意但可能降低质量。此参数从累积概率达到p值的词汇中随机选择')} >
          <Slider min={0} max={1} step={0.1} defaultValue={1} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const toolTip = (label: string, text: string) => {
  return (
    <div className='flex items-center gap-1'>
      <span className=''>{label}</span>
      <Tooltip title={text}>
        <InfoCircleOutlined className='text-gray-500' />
      </Tooltip>
    </div>
  )
}

export default ModelFormModal; 
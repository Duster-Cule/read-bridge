import { useEffect } from 'react';
import { Form, Input, Modal, Slider } from 'antd';
import { Model } from '@/src/types/llm';

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
        name: values.name,
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
        <Form.Item name="id" label="模型ID" rules={[{ required: true, message: '请输入模型ID' }]}>
          <Input
            placeholder="输入模型ID"
            onChange={handleIdChange}
          />
        </Form.Item>
        <Form.Item name="name" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
          <Input placeholder="输入模型名称" />
        </Form.Item>
        <Form.Item name="temperature" label="Temperature" >
          <Slider min={0} max={1} step={0.1} defaultValue={0.5} />
        </Form.Item>
        <Form.Item name="topP" label="Top P" >
          <Slider min={0} max={1} step={0.1} defaultValue={1} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModelFormModal; 
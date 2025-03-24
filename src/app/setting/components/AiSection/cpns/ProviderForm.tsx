import { Form, Input, Button, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Provider, Model } from '@/src/types/llm';
import ModelCard from './ModelCard';

interface ProviderFormProps {
  provider: Provider;
  form: any;
  onProviderUpdate: (values: any) => void;
  onAddModel: () => void;
  onEditModel: (model: Model) => void;
  onDeleteModel: (modelId: string) => void;
  onDeleteProvider: () => void;
}

const ProviderForm = ({
  provider,
  form,
  onProviderUpdate,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onDeleteProvider
}: ProviderFormProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={4}>{provider.name}</Typography.Title>
        {!provider.isDefault && (
          <Popconfirm
            title="确定要删除这个服务商吗?"
            onConfirm={onDeleteProvider}
            okText="确定"
            cancelText="取消"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onProviderUpdate}
        onValuesChange={(_, values) => onProviderUpdate(values)}
      >
        <Form.Item name="name" label="服务商名称" rules={[{ required: true }]}>
          <Input placeholder="服务商名称" />
        </Form.Item>

        <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}>
          <Input placeholder="API 基础 URL" />
        </Form.Item>

        <Form.Item name="apiKey" label="API Key" rules={[{ required: true }]}>
          <Input.Password placeholder="API Key" />
        </Form.Item>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Typography.Title level={5}>模型</Typography.Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddModel}>
              添加模型
            </Button>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            {provider.models.map(model => (
              <ModelCard
                key={model.id}
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
import { Card, Typography, Space, Button } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Model } from '@/src/types/llm';

interface ModelCardProps {
  model: Model;
  onEdit: (model: Model) => void;
  onDelete: (modelId: string) => void;
}

const ModelCard = ({ model, onEdit, onDelete }: ModelCardProps) => {
  return (
    <Card key={model.id} size="small">
      <div className="flex justify-between items-center">
        <div className='flex justify-start items-center'>
          <Typography.Text strong>{model.name}</Typography.Text>
          <Typography.Text className='ml-2 text-gray-500'>{model.id}</Typography.Text>
        </div>
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(model)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => onDelete(model.id)}
          />
        </Space>
      </div>
      <div className="mt-2">
        <div className="flex justify-between">
          <span>Temperature: {model.temperature}</span>
          <span>Top P: {model.topP}</span>
        </div>
      </div>
    </Card>
  );
};

export default ModelCard; 
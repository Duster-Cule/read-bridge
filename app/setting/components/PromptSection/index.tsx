import { Card } from "../index";
import { useOutputOptions } from "@/store/useOutputOptions";
import { Button, Modal, Form, Input, Typography, theme, Flex, List, FormInstance } from 'antd';
import { useState } from "react";
import { PromptOption } from "@/types/llm";
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { useToken } = theme;

export default function PromptSection() {
  const { token } = useToken();
  const { promptOptions, addPromptOptions, updatePromptOptions, deletePromptOptions } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form] = Form.useForm<PromptOption>();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        updatePromptOptions(values);
      } else {
        addPromptOptions(values);
      }
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: PromptOption) => {
    form.setFieldsValue(item);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleDelete = (item: PromptOption) => {
    deletePromptOptions(item);
  };

  return (
    <Card className="flex flex-col color-[var(--color-text-primary)]">
      <Flex justify="space-between" align="center" style={{ marginBottom: token.marginMD }}>
        <Title level={5} style={{ margin: 0 }}>聊天提示词管理</Title>
        <Button icon={<PlusOutlined />} onClick={showModal}>添加提示词</Button>
      </Flex>
      <List
        itemLayout="horizontal"
        dataSource={promptOptions}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} key="list-edit">修改</Button>,
              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item)} key="list-delete">删除</Button>,
            ]}
          >
            <List.Item.Meta
              title={<a href="#">{item.name}</a>}
              description={<ExpandableDescription text={item.prompt} maxLength={100} />}
            />
          </List.Item>
        )}
      />

      <PromptModal isModalOpen={isModalOpen} handleOk={handleOk} handleCancel={handleCancel} form={form} isEdit={isEdit} />
    </Card >
  );
}

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

function ExpandableDescription({ text = '暂无提示词', maxLength = 100 }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text.length > maxLength;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Paragraph ellipsis={isTruncated && !expanded ? { rows: 1, expandable: false, symbol: '' } : false}>
        {text}
      </Paragraph>
      {isTruncated && (
        <Button type="link" onClick={toggleExpanded} style={{ padding: 0 }}>
          {expanded ? '收起' : '展开'}
        </Button>
      )}
    </div>
  );
}

function PromptModal({ isModalOpen, handleOk, handleCancel, form, isEdit = false }: { isModalOpen: boolean, handleOk: () => void, handleCancel: () => void, form: FormInstance<PromptOption>, isEdit?: boolean }) {
  return <Modal title={isEdit ? "修改提示词" : "添加提示词"} open={isModalOpen} onOk={handleOk} onCancel={handleCancel} destroyOnClose>
    <Form form={form} layout="vertical" name="add_prompt_form">
      <Form.Item
        name="name"
        label="提示词名称"
        rules={[{ required: true, message: '请输入提示词名称' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="prompt"
        label="提示词内容"
      >
        <Input.TextArea rows={4} />
      </Form.Item>
    </Form>
  </Modal>
}


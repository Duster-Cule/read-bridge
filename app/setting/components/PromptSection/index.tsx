import { Card } from "../index";
import { useOutputOptions } from "@/store/useOutputOptions";
import { Button, Modal, Form, Input, Typography, theme, Flex, List } from 'antd';
import { useState } from "react";
import { PromptOption } from "@/types/llm";
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { useToken } = theme;

export default function PromptSection() {
  const { token } = useToken();
  const { promptOptions, addPromptOptions } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<PromptOption>();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      addPromptOptions(values);
      form.resetFields();
      setIsModalOpen(false);
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
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
          <List.Item>
            <List.Item.Meta
              title={<a href="https://ant.design">{item.name}</a>}
              description={item.prompt}
            />
          </List.Item>
        )}
      />

      <Modal title="Add New Prompt" open={isModalOpen} onOk={handleOk} onCancel={handleCancel} destroyOnClose>
        <Form form={form} layout="vertical" name="add_prompt_form">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the prompt name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="prompt"
            label="Prompt"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </Card >
  );
}


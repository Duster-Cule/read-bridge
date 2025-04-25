import { useMemo, useState } from "react";
import { Card } from "../index";
import { Button, Modal, Form, Input, Select, Popconfirm, theme, List, Typography, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { useOutputOptions } from "@/store/useOutputOptions";
import { OutputOption } from "@/types/llm";
import { OUTPUT_TYPE } from "@/constants/prompt";
import TextArea from "antd/es/input/TextArea";

export default function SentenceProcessingSection() {
  const { token } = theme.useToken();
  const { sentenceOptions, addSentenceOptions, updateSentenceOptions, deleteSentenceOptions, resetSentenceOptions } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentOption, setCurrentOption] = useState<OutputOption | null>(null);
  const [form] = Form.useForm<OutputOption>();
  const typeMap = useMemo(() => ({
    [OUTPUT_TYPE.TEXT]: "纯文本输出",
    [OUTPUT_TYPE.SIMPLE_LIST]: "列表输出",
    [OUTPUT_TYPE.KEY_VALUE_LIST]: "键值列表",
  }), []);

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentOption(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: OutputOption) => {
    setIsEdit(true);
    setCurrentOption(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record: OutputOption) => {
    deleteSentenceOptions(record);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit && currentOption) {
        updateSentenceOptions({
          ...values,
          id: currentOption.id,
        });
      } else {
        addSentenceOptions(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  return (
    <Card>
      <div className="flex flex-col">
        <List
          dataSource={sentenceOptions}
          rowKey="id"
          renderItem={(item: OutputOption) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(item)}
                />,
                <Popconfirm
                  title="确定要删除这项配置吗?"
                  onConfirm={() => handleDelete(item)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<Typography.Title level={5}>{item.name}</Typography.Title>}
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Typography.Text type="secondary">处理类型: {typeMap[item.type as keyof typeof typeMap] || item.type}</Typography.Text>
                    <Typography.Paragraph ellipsis={{ rows: 2 }}>{item.rulePrompt}</Typography.Paragraph>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <div className="flex justify-end items-center mt-4 gap-2">
          <Button

            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加配置
          </Button>
          <Popconfirm
            title="重置配置"
            description="确定要重置句子处理配置吗？"
            onConfirm={resetSentenceOptions}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<ReloadOutlined />}>重置</Button>
          </Popconfirm>
        </div>
      </div>

      <Modal
        title={isEdit ? "编辑句子处理配置" : "添加句子处理配置"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入配置名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="输出类型"
            rules={[{ required: true, message: "请选择输出类型" }]}
          >
            <Select placeholder="请选择输出类型">
              {Object.entries(typeMap).map(([key, value]) => (
                <Select.Option key={key} value={key}>{value}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="rulePrompt"
            label="规则提示词"
            rules={[{ required: true, message: "请输入规则提示词" }]}
          >
            <TextArea
              placeholder="请输入规则提示词"
              autoSize={{ minRows: 5, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}


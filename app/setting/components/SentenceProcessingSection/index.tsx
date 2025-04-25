import { useMemo, useState } from "react";
import { Card } from "../index";
import { Button, Table, Modal, Form, Input, Select, Popconfirm, theme } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useOutputOptions } from "@/store/useOutputOptions";
import { OutputOption } from "@/types/llm";
import { OUTPUT_TYPE, OUTPUT_PROMPT, INPUT_PROMPT } from "@/constants/prompt";
import TextArea from "antd/es/input/TextArea";

export default function SentenceProcessingSection() {
  const { token } = theme.useToken();
  const { sentenceOptions, addSentenceOptions, updateSentenceOptions, deleteSentenceOptions } = useOutputOptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentOption, setCurrentOption] = useState<OutputOption | null>(null);
  const [form] = Form.useForm<OutputOption>();
  const typeMap = useMemo(() => ({
    [OUTPUT_TYPE.TEXT]: "纯文本输出",
    [OUTPUT_TYPE.SIMPLE_LIST]: "列表输出",
    [OUTPUT_TYPE.KEY_VALUE_LIST]: "键值列表",
  }), []);
  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        return typeMap[type as keyof typeof typeMap] || type;
      },
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: OutputOption) => (
        <div className="flex space-x-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这项配置吗?"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold">句子处理配置</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加配置
          </Button>
        </div>

        <Table
          dataSource={sentenceOptions}
          columns={columns}
          rowKey="id"
          pagination={false}
          style={{ backgroundColor: token.colorBgContainer }}
        />
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


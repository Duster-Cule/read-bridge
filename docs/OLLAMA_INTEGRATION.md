# Ollama 集成说明

## 概述

现在应用已经支持使用 Ollama 在本地运行大语言模型。Ollama 允许你在自己的机器上运行开源的大型语言模型，无需云端API。

## 安装 Ollama

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### macOS
```bash
brew install ollama
```

或者从 [Ollama 官网](https://ollama.com) 下载安装包。

### Windows
从 [Ollama 官网](https://ollama.com) 下载 Windows 安装包。

## 下载模型

安装 Ollama 后，你需要下载模型。以下是一些推荐的模型：

```bash
# 下载 Llama 3.2（轻量级）
ollama pull llama3.2

# 下载 Qwen 2.5（中文优化）
ollama pull qwen2.5

# 下载 Mistral（性能均衡）
ollama pull mistral

# 下载 DeepSeek Coder（代码优化）
ollama pull deepseek-coder
```

查看所有可用模型：
```bash
ollama list
```

## 使用方法

1. **启动 Ollama 服务**
   
   Ollama 通常会在安装后自动启动。如果没有，运行：
   ```bash
   ollama serve
   ```

2. **在应用中配置**
   
   - 打开设置页面
   - 找到 "Ollama (本地)" 服务提供商
   - 确认基础 URL 为 `http://localhost:11434`（默认值）
   - 在模型列表中添加你已下载的模型（如 `llama3.2`, `qwen2.5`）

3. **选择模型**
   
   在聊天或解析设置中，选择 Ollama 提供的模型即可开始使用。

## 配置说明

### 基础 URL
- 默认：`http://localhost:11434`
- 如果 Ollama 运行在不同端口或远程服务器上，请相应修改

### API Key
- Ollama 不需要 API Key
- 应用会自动处理，无需配置

### 模型 ID
- 模型 ID 必须与 Ollama 中已下载的模型名称完全一致
- 可以通过 `ollama list` 命令查看已下载的模型

## 常见问题

### 连接失败
1. 确认 Ollama 服务正在运行：`ollama list`
2. 检查防火墙设置
3. 确认端口 11434 没有被其他程序占用

### 模型未找到
1. 确认模型已下载：`ollama list`
2. 检查模型 ID 是否与下载的模型名称一致
3. 模型名称区分大小写

### 性能问题
1. 确保你的硬件满足模型要求（特别是内存和GPU）
2. 尝试使用更小的模型
3. 考虑调整 `temperature` 和 `top_p` 参数

## 推荐模型

| 模型 | 大小 | 特点 | 推荐用途 |
|------|------|------|----------|
| llama3.2 | ~2GB | 轻量快速 | 日常对话 |
| qwen2.5 | ~4GB | 中文优化 | 中文内容处理 |
| mistral | ~4GB | 性能均衡 | 通用任务 |
| deepseek-coder | ~6GB | 代码优化 | 代码生成与分析 |

## 更多信息

- [Ollama 官方文档](https://github.com/ollama/ollama)
- [可用模型列表](https://ollama.com/library)

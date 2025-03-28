import { Provider, Model, Client } from "@/types/llm"

import OpenAI from "openai"

export function createOpenAIClient(provider: Provider, model: Model, prompt: string): Client {

  const { baseUrl, apiKey } = provider
  const sdk = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  async function* completionsGenerator(messages: OpenAI.Chat.ChatCompletionMessageParam[]): AsyncGenerator<string, void, unknown> {
    const systemMessage = (prompt ? { role: 'system', content: prompt } : undefined) as OpenAI.Chat.ChatCompletionMessageParam

    // 创建请求参数
    const params = {
      model: model.id,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
      temperature: model.temperature,
      top_p: model.topP,
      max_tokens: 1000,
      stream: true,
    }

    // 使用代理 API 路由而不是直接调用 OpenAI
    const apiUrl = '/api/llm/proxy'
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}/chat/completions`,
        apiKey: apiKey,
        ...params
      }),
    })

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API 请求失败: ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function* streamResponse() {
      let isThinking = false;
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 处理可能分成多块的事件流
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              // 处理心跳消息
              if (data === '[DONE]') continue;

              try {
                const chunk = JSON.parse(data);

                // 使用联合类型来处理标准Delta和扩展属性
                type ExtendedDelta = OpenAI.Chat.ChatCompletionChunk.Choice.Delta & {
                  reasoning_content?: string;
                  reasoning?: string;
                };

                const delta = chunk.choices[0]?.delta as ExtendedDelta;
                const think = delta?.reasoning_content || delta?.reasoning || '';
                const content = delta?.content || '';

                // 处理思考内容
                if (think) {
                  if (!isThinking) {
                    yield '<think>';
                    isThinking = true;
                  }
                  yield think;
                }

                // 处理普通内容
                if (content) {
                  if (isThinking) {
                    yield '</think>';
                    isThinking = false;
                  }
                  yield content;
                }
              } catch (e) {
                console.error('Error parsing JSON:', e, data);
              }
            }
          }
        }
      } finally {
        // 确保最后关闭思考标签
        if (isThinking) {
          yield '</think>';
        }
      }
    }

    yield* streamResponse();
  }

  return {
    completionsGenerator
  }
}

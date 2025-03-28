import { LLM_PROXY_PATH, LLM_PROXY_URL } from "@/constants/llm";
import { Provider, Model, Client } from "@/types/llm"

import OpenAI from "openai"

export function createOpenAIClient(provider: Provider, model: Model, prompt: string): Client {
  const { baseUrl, apiKey } = provider

  const openaiClient = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  const baseRequestParams = {
    model: model.id,
    temperature: model.temperature,
    top_p: model.topP,
    max_tokens: 1000,
    stream: true,
  }

  let useProxy = false;
  async function* completionsGenerator(messages: OpenAI.Chat.ChatCompletionMessageParam[]): AsyncGenerator<string, void, unknown> {
    const systemMessage = (prompt ? { role: 'system', content: prompt } : undefined) as OpenAI.Chat.ChatCompletionMessageParam
    const params = {
      ...baseRequestParams,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    if (!useProxy) {
      // 优先本地请求
      try {
        const openaiStream = await openaiClient.chat.completions.create({
          ...params,
        });
        if (openaiStream) {
          yield* processOpenAIClientStream(openaiStream as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>);
          return;
        }
      } catch (error) {
        console.log('本地请求失败，尝试使用代理:', error);
        useProxy = true;
      }
    }

    // 使用代理请求
    const response = await fetch(LLM_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${baseUrl}${LLM_PROXY_PATH}`,
        apiKey: apiKey,
        ...params
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API 请求失败: ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // 处理 fetch API 的流式响应
    yield* processFetchStream(response.body);
  }

  // 处理 OpenAI 客户端流
  async function* processOpenAIClientStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): AsyncGenerator<string, void, unknown> {
    let isThinking = false;

    try {
      for await (const chunk of stream) {
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
      }
    } finally {
      // 确保最后关闭思考标签
      if (isThinking) {
        yield '</think>';
      }
    }
  }

  // 处理 fetch API 流
  async function* processFetchStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
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

  return {
    completionsGenerator
  }
}

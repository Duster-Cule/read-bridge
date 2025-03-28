import { LLM_PROXY_PATH, LLM_PROXY_URL } from "@/constants/llm";
import { Provider, Model, Client } from "@/types/llm"

import OpenAI from "openai"

export function createOpenAIClient(provider: Provider, model: Model, prompt: string): Client {
  const { baseUrl, apiKey } = provider

  const systemMessage = (prompt ? { role: 'system', content: prompt } : undefined) as OpenAI.Chat.ChatCompletionMessageParam

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
  }

  let useProxy = false;
  async function* completionsGenerator(messages: OpenAI.Chat.ChatCompletionMessageParam[]): AsyncGenerator<string, void, unknown> {
    const params = {
      ...baseRequestParams,
      stream: true,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    if (!useProxy) {
      // 优先本地请求
      try {
        const openaiStream = await openaiClient.chat.completions.create({
          ...params,
        });
        if (openaiStream) {
          yield* processUnifiedStream(openaiStream as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>);
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

    yield* processUnifiedStream(response.body);
  }
  async function completions(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    const params = {
      ...baseRequestParams,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    if (!useProxy) {
      try {
        const result = await openaiClient.chat.completions.create(params);
        return result.choices[0].message.content || '';
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
    const result = await response.json();
    const thinking = result.choices[0].message.reasoning_content
    const content = result.choices[0].message.content
    return `${thinking}\n${content}`
  }
  return {
    completionsGenerator,
    completions
  }
}

async function* processFetchStream(body: ReadableStream<Uint8Array>): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
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
            // 将SSE数据解析为OpenAI格式的chunk
            const chunk = JSON.parse(data);
            yield chunk as OpenAI.Chat.Completions.ChatCompletionChunk;
          } catch (e) {
            console.error('Error parsing JSON:', e, data);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error processing fetch stream:', e);
  }
}

// 统一处理两种流的函数
async function* processUnifiedStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
  const openAIStyleStream = stream instanceof ReadableStream ? processFetchStream(stream) : stream;

  let isThinking = false;

  try {
    for await (const chunk of openAIStyleStream) {
      type ExtendedDelta = OpenAI.Chat.ChatCompletionChunk.Choice.Delta & {
        reasoning_content?: string;
        reasoning?: string;
      };

      const delta = chunk.choices[0]?.delta as ExtendedDelta;
      const think = delta?.reasoning_content || delta?.reasoning || '';
      const content = delta?.content || '';

      if (think) {
        if (!isThinking) {
          yield '<think>';
          isThinking = true;
        }
        yield think;
      }

      if (content) {
        if (isThinking) {
          yield '</think>';
          isThinking = false;
        }
        yield content;
      }
    }
  } finally {
    if (isThinking) {
      yield '</think>';
    }
  }
}
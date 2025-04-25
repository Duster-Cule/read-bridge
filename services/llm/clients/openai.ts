import { LLM_PROXY_PATH, LLM_PROXY_URL } from "@/constants/llm";
import { Provider, Model, Client, ClientOptions } from "@/types/llm"
import { message } from 'antd'
import OpenAI from "openai"

export function createOpenAIClient(provider: Provider, model: Model, options?: ClientOptions): Client {

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
    ...options
  }

  let useProxy = false;
  // 初始更新一次useProxy

  check()

  async function check(): Promise<{ valid: boolean, error: Error | null }> {
    try {
      for await (const chunk of completionsGenerator([{ role: 'user', content: 'hi' }])) {
        return { valid: true, error: null }
      }
      return { valid: false, error: new Error("No response received") };
    } catch (error) {
      return { valid: false, error: error as Error }
    }
  }

  // 统一API请求处理函数
  async function _executeApiRequest<T>(params: {
    model: string,
    temperature: number,
    top_p: number,
    stream?: boolean,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    [key: string]: number | string | boolean | OpenAI.Chat.ChatCompletionMessageParam[] | undefined
  }, isStream: boolean, signal?: AbortSignal): Promise<T> {
    const errorList: Error[] = []
    if (!useProxy) {
      try {
        const result = await openaiClient.chat.completions.create(
          {
            ...params,
          },
          { signal }
        );
        return result as T;
      } catch (error) {
        if (signal?.aborted) {
          return null as T
        }
        else {
          console.log('本地请求失败，尝试使用代理:', error);
          errorList.push(error as Error)
          useProxy = true;
        }
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
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      errorList.push(new Error(`API 请求失败: ${error}`))
      throw new Error(errorList.join('\n'));
    }

    if (!response.body) {
      errorList.push(new Error('No response body'))
      throw new Error(errorList.join('\n'));
    }

    if (isStream) {
      return response.body as T;
    } else {
      return await response.json() as T;
    }
  }

  async function* completionsGenerator(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    prompt = '',
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const systemMessage = prompt ? formatSystemMessage(prompt) : undefined
    const params = {
      ...baseRequestParams,
      stream: true,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    try {
      const stream = await _executeApiRequest<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | ReadableStream<Uint8Array>>(params, true, signal);
      yield* processUnifiedStream(stream, signal);
    } catch (error) {
      if (signal?.aborted) {
        return
      }

      console.error('Stream completion error:', error);
      message.error(String(error))
      throw error;
    }
  }

  async function completions(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    prompt = '',
    signal?: AbortSignal
  ): Promise<string> {
    const systemMessage = prompt ? formatSystemMessage(prompt) : undefined
    const params = {
      ...baseRequestParams,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    try {
      const result = await _executeApiRequest<{ choices: { message: { reasoning_content?: string, reasoning?: string, content?: string } }[] }>(params, false, signal);

      if (result.choices && result.choices[0]) {
        const choice = result.choices[0]
        const thinking = choice.message.reasoning_content || choice.message.reasoning;
        const content = choice.message.content;
        return thinking ? `${thinking}\n${content}` : content || '';
      }

      return '';
    } catch (error) {
      if (signal?.aborted) {
        return ''
      }
      console.error('Completion error:', error);
      message.error(String(error))
      throw error;
    }
  }

  return {
    name: model.name,
    id: model.id,
    Provider: provider,
    completionsGenerator,
    completions,
    check,
  }
}

function formatSystemMessage(prompt: string): OpenAI.Chat.ChatCompletionMessageParam {
  return { role: 'system', content: prompt }
}

// 格式化FetchStream
async function* processFetchStream(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown> {
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
  } catch (error) {
    if (signal?.aborted) {
      await reader.cancel();
      return
    }
    console.error('Error processing fetch stream:', error);
    throw error;
  }
}

// 统一处理两种流的函数
async function* processUnifiedStream(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
  const openAIStyleStream = stream instanceof ReadableStream ? processFetchStream(stream, signal) : stream;

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
  } catch (error) {
    if (signal?.aborted) {
      return
    }
    console.error('Stream completion error:', error);
    throw error;
  } finally {
    if (isThinking) {
      yield '</think>';
    }
  }
}
import { Provider, Model, Client, ClientOptions } from "@/types/llm"
import { message } from 'antd'
import OpenAI from "openai"

export function createOllamaClient(provider: Provider, model: Model, options?: ClientOptions): Client {

  const { baseUrl } = provider
  // Ollama使用OpenAI兼容的API，但不需要API key
  const ollamaClient = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: 'ollama', // Ollama不需要真实的API key，但OpenAI SDK要求提供
    baseURL: `${baseUrl}/v1`, // Ollama的OpenAI兼容端点
  });

  const baseRequestParams = {
    model: model.id,
    temperature: model.temperature,
    top_p: model.topP,
    ...options
  }

  async function check(): Promise<{ valid: boolean, error: Error | null }> {
    try {
      // 使用一个简单的请求来测试连接
      for await (const chunk of completionsGenerator([{ role: 'user', content: 'hi' }])) {
        return { valid: true, error: null }
      }
      return { valid: false, error: new Error("No response received") };
    } catch (error) {
      return { valid: false, error: error as Error }
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
      stream: true as const,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
    }

    try {
      const stream = await ollamaClient.chat.completions.create(params, { signal });
      
      if (Symbol.asyncIterator in stream) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        }
      }
    } catch (error) {
      if (signal?.aborted) {
        return
      }
      displayError(error, 'Stream completion')
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
      const result = await ollamaClient.chat.completions.create(params, { signal });

      if (result.choices && result.choices[0]) {
        const choice = result.choices[0]
        const content = choice.message.content;
        return content || '';
      }

      return '';
    } catch (error) {
      if (signal?.aborted) {
        return ''
      }
      displayError(error, 'Completion')
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

function displayError(error: unknown, type: string): void {
  console.error(type ? `${type} error:` : '', error)
  const errorMessage = String(error).slice(0, 100)
  message.error(errorMessage + (String(error).length > 100 ? '...' : ''))
}

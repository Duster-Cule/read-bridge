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

    const stream = await sdk.chat.completions.create({
      model: model.id,
      messages: systemMessage ? [systemMessage, ...messages] : messages,
      temperature: model.temperature,
      top_p: model.topP,
      max_tokens: 1000,
      stream: true,
    })

    async function* streamResponse() {
      let isThinking = false;

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

      if (isThinking) {
        yield '</think>';
      }
    }
    yield* streamResponse();
  }

  return {
    completionsGenerator
  }
}

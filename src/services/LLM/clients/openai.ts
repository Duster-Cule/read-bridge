import { Provider, Model, Client } from "@/src/types/llm"

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
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    }
    yield* streamResponse();
  }

  return {
    completionsGenerator
  }
}

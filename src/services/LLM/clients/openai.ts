import { Provider, Model, Client } from "@/src/types/llm"

import OpenAI from "openai"

export function createOpenAIClient(provider: Provider, model: Model, prompt: string): Client {
  const { baseUrl, apiKey } = provider
  const { id, name, temperature, topP } = model
  const sdk = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  async function completions(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
    console.log(messages)
    const systemMessage = (prompt ? { role: 'system', content: prompt } : undefined) as OpenAI.Chat.ChatCompletionMessageParam
    const completion = await sdk.chat.completions.create({
      model: model.id,
      messages: [systemMessage, ...messages],
      temperature,
      top_p: topP,
      max_tokens: 1000,
      stream: false,
    })
    console.log(completion, 'completion')
    return completion.choices[0].message.content
  }
  return {
    completions
  }
}

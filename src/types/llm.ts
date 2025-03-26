import { OpenAI } from 'openai'

export type Model = {
  id: string
  name: string
  providerId: string
  temperature: number
  topP: number
}

export type Provider = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  isDefault?: boolean
  models: Model[]
}

export type Client = {
  completionsGenerator: (messages: OpenAI.Chat.ChatCompletionMessageParam[]) => AsyncGenerator<string, void, unknown>
}


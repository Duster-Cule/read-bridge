import { OpenAI } from 'openai'
import { OutputType } from '@/types/prompt'

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
  name: string,
  id: string,
  Provider: Provider,
  completionsGenerator: (
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    prompt?: string,
    signal?: AbortSignal
  ) => AsyncGenerator<string, void, unknown>
  completions: (
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    prompt?: string,
    signal?: AbortSignal
  ) => Promise<string>
  check: () => Promise<{ valid: boolean, error: Error | null }>
}

export type ClientOptions = {
  maxTokens?: number
  [key: string]: number | string | undefined
}


export type OutputOption = {
  name: string
  type: OutputType
  rulePrompt: string
  outputPrompt: string
}


export type LLMHistory = {
  id: string
  title: string
  timestamp: number
  prompt: string
  messages: {
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
    name?: string // 模型名称
  }[]
}



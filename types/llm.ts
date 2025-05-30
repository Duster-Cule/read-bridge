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
  max_tokens?: number
  [key: string]: number | string | undefined
}


export type OutputOption = {
  id: string
  name: string
  type: OutputType
  rulePrompt: string
}

export type WordOption = {
  id: string
  name: string
  rulePrompt: string
}

export type PromptOption = {
  id: string
  name: string
  prompt: string
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
    reasoningContent?: string // 思考内容
    thinkingTime?: number // 思考时间
  }[]
}



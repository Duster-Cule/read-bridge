import { Model, ClientOptions } from "@/types/llm"
import { useLLMStore } from '@/store/useLLMStore'
import { createOpenAIClient } from './clients/openai'
import { LLM_CLIENT_OPTIONS } from "@/constants/llm"

export function createLLMClient(model: Model, options?: ClientOptions) {
  const provider = useLLMStore.getState().providers.find(p => p.id === model.providerId)
  if (!provider) {
    throw new Error('Provider not found')
  }

  const clientOptions = {
    ...LLM_CLIENT_OPTIONS,
    ...(options ? options : {})
  }

  switch (provider.id) {
    case 'openai':
      return createOpenAIClient(provider, model, clientOptions)
    default:
      // 默认使用openai 兼容
      return createOpenAIClient(provider, model, clientOptions)
    // TODO 未来兼容claude gemini 
  }
}
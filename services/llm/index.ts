import { Model } from "@/types/llm"
import { useLLMStore } from '@/store/useLLMStore'
import { createOpenAIClient } from './clients/openai'

export function createLLMClient(model: Model) {
  const provider = useLLMStore.getState().providers.find(p => p.id === model.providerId)
  if (!provider) {
    throw new Error('Provider not found')
  }

  switch (provider.id) {
    case 'openai':
      return createOpenAIClient(provider, model)
    default:
      // 默认使用openai 兼容
      return createOpenAIClient(provider, model)
    // TODO 未来兼容claude gemini 
  }
}
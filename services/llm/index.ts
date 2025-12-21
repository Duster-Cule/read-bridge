import { Model, ClientOptions } from "@/types/llm"
import { useLLMStore } from '@/store/useLLMStore'
import { useLLMSecretStore } from '@/store/useLLMSecretStore'
import { createOpenAIClient } from './clients/openai'
import { createOllamaClient } from './clients/ollama'
import { LLM_CLIENT_OPTIONS } from "@/constants/llm"

function normalizeApiKey(raw: string): string {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  return trimmed.replace(/^Bearer\s+/i, '').trim()
}

export function createLLMClient(model: Model, options?: ClientOptions) {
  const provider = useLLMStore.getState().providers.find(p => p.id === model.providerId)
  if (!provider) {
    throw new Error('Provider not found')
  }

  const clientOptions = {
    ...LLM_CLIENT_OPTIONS,
    ...(options ? options : {})
  }

  // 根据provider的type字段来选择客户端
  if (provider.type === 'ollama') {
    return createOllamaClient(provider, model, clientOptions)
  }

  // API keys are stored in the secret store and stripped from persisted provider state.
  const secretKey = useLLMSecretStore.getState().getApiKey(provider.id)
  const apiKey = normalizeApiKey(secretKey || provider.apiKey || '')
  const providerWithKey = { ...provider, apiKey }

  switch (provider.id) {
    case 'openai':
      return createOpenAIClient(providerWithKey, model, clientOptions)
    default:
      // 默认使用openai 兼容
      return createOpenAIClient(providerWithKey, model, clientOptions)
    // TODO 未来兼容claude gemini 
  }
}
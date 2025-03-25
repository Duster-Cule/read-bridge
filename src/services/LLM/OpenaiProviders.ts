import { Provider, Model } from "@/src/types/llm"
import { useLLMStore } from '@/src/store/useLLMStore'
export function createAISDK(model: Model) {
  const provider = useLLMStore.getState().providers.find(p => p.id === model.providerId)
  if (!provider) {
    throw new Error('Provider not found')
  }
  const { baseUrl, apiKey } = provider
  const { id, name, temperature, topP } = model
}

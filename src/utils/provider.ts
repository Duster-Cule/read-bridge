import { Provider } from '@/src/types/llm'

export const newProvider = (): Provider => {
  return {
    id: crypto.randomUUID(),
    name: 'new Provider',
    baseUrl: '',
    apiKey: '',
    models: [],
  }
}

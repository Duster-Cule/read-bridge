import { Provider } from '@/types/llm'

export const newProvider = (): Provider => {
  return {
    id: self.crypto.randomUUID(),
    name: 'new Provider',
    baseUrl: '',
    apiKey: '',
    models: [],
  }
}

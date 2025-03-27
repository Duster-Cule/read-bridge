import { Provider } from '@/src/types/llm'
import crypto from 'crypto';

export const newProvider = (): Provider => {
  return {
    id: crypto.randomUUID(),
    name: 'new Provider',
    baseUrl: '',
    apiKey: '',
    models: [],
  }
}

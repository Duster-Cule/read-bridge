import { Provider } from "@/src/types/llm";

export const defaultProviders = (): Provider[] => {
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'o1-preview',
          name: 'o1-preview',
          temperature: 0.6,
          topP: 1,
        },
        {
          id: 'o1-mini',
          name: 'o1-mini',
          temperature: 0.6,
          topP: 1,
        }
      ],
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      model: [
        {
          id: 'deepseek-chat',
          name: 'DeepSeek Chat',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'deepseek-reasoner',
          name: 'DeepSeek Reasoner',
          temperature: 0.6,
          topP: 1,
        }
      ]
    }
  ]
}

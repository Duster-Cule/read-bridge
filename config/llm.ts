import { Provider } from "@/types/llm";

export const defaultProviders = (): Provider[] => {
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      isDefault: true,
      models: [
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          providerId: 'openai',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          providerId: 'openai',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'o1-preview',
          name: 'o1-preview',
          providerId: 'openai',
          temperature: 0.6,
          topP: 1,
        },
        {
          id: 'o1-mini',
          name: 'o1-mini',
          providerId: 'openai',
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
      isDefault: true,
      models: [
        {
          id: 'deepseek-chat',
          name: 'DeepSeek Chat',
          providerId: 'deepseek',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'deepseek-reasoner',
          name: 'DeepSeek Reasoner',
          providerId: 'deepseek',
          temperature: 0.6,
          topP: 1,
        }
      ]
    },
    {
      id: 'volcengine',
      name: '火山引擎',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      apiKey: '',
      isDefault: true,
      models: [
        {
          id: 'deepseek-v3-241226',
          name: 'DeepSeek Chat',
          providerId: 'volcengine',
          temperature: 0.5,
          topP: 1,
        },
      ],
    },
    {
      id: 'ollama',
      name: 'Ollama (本地)',
      baseUrl: 'http://localhost:11434',
      apiKey: 'ollama', // ollama不需要apiKey，但为了兼容现有逻辑，设置一个默认值
      isDefault: true,
      type: 'ollama',
      models: [
        {
          id: 'llama3.2',
          name: 'Llama 3.2',
          providerId: 'ollama',
          temperature: 0.5,
          topP: 1,
        },
        {
          id: 'qwen2.5',
          name: 'Qwen 2.5',
          providerId: 'ollama',
          temperature: 0.5,
          topP: 1,
        },
      ],
    }
  ]
}

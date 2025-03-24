export type Model = {
  id: string
  name: string
  temperature: number
  topP: number
}

export type Provider = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  isDefault?: boolean
  model: Model[]
}


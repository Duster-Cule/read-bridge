import { createJSONStorage, type StateStorage } from 'zustand/middleware'

type PersistedKV = Record<string, string>

type WindowWithTauri = Window & {
  __TAURI__?: {
    core?: {
      invoke?: <T>(cmd: string, args?: unknown) => Promise<T>
    }
    invoke?: <T>(cmd: string, args?: unknown) => Promise<T>
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function isTauri(): boolean {
  if (!isBrowser()) return false
  const w = window as WindowWithTauri
  return typeof w.__TAURI__?.core?.invoke === 'function' || typeof w.__TAURI__?.invoke === 'function'
}

const memoryStore = new Map<string, string>()

const memoryStorage: StateStorage = {
  getItem: async (name) => memoryStore.get(name) ?? null,
  setItem: async (name, value) => {
    memoryStore.set(name, value)
  },
  removeItem: async (name) => {
    memoryStore.delete(name)
  },
}

async function tauriInvoke<T>(cmd: string, args?: unknown): Promise<T> {
  const w = window as WindowWithTauri
  const invoker = w.__TAURI__?.core?.invoke ?? w.__TAURI__?.invoke
  if (!invoker) {
    throw new Error('Tauri invoke is not available')
  }
  return invoker<T>(cmd, args)
}

const tauriKVStorage: StateStorage = {
  getItem: async (name) => {
    const value = await tauriInvoke<string | null>('kv_get', { key: name })
    return value ?? null
  },
  setItem: async (name, value) => {
    await tauriInvoke<void>('kv_set', { key: name, value })
  },
  removeItem: async (name) => {
    await tauriInvoke<void>('kv_remove', { key: name })
  },
}

const apiKVStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const res = await fetch(`/api/settings/kv?key=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[settings kv] get failed ${res.status}`, text)
        return null
      }
      const data = (await res.json()) as { value: string | null }
      return data.value
    } catch (e) {
      console.error('[settings kv] get failed (network)', e)
      return null
    }
  },
  setItem: async (name, value) => {
    try {
      const res = await fetch('/api/settings/kv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: name, value }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[settings kv] set failed ${res.status}`, text)
      }
    } catch (e) {
      console.error('[settings kv] set failed (network)', e)
    }
  },
  removeItem: async (name) => {
    try {
      const res = await fetch('/api/settings/kv', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: name }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[settings kv] remove failed ${res.status}`, text)
      }
    } catch (e) {
      console.error('[settings kv] remove failed (network)', e)
    }
  },
}

function getPrimaryStorage(): StateStorage {
  if (!isBrowser()) return memoryStorage
  if (isTauri()) return tauriKVStorage
  return apiKVStorage
}

function loadPersisted<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function savePersisted(value: unknown): string {
  return JSON.stringify(value)
}

function sanitizeLLMPersistedAndExtractSecrets(raw: string): { sanitized: string; secrets: Record<string, string> } | null {
  const persisted = loadPersisted<any>(raw)
  if (!persisted || typeof persisted !== 'object') return null
  const state = persisted.state
  if (!state || typeof state !== 'object' || !Array.isArray(state.providers)) return null

  const secrets: Record<string, string> = {}
  const providers = state.providers.map((p: any) => {
    if (!p || typeof p !== 'object') return p
    const id = typeof p.id === 'string' ? p.id : ''
    const type = typeof p.type === 'string' ? p.type : undefined
    const apiKey = typeof p.apiKey === 'string' ? p.apiKey : ''

    if (id && type !== 'ollama' && apiKey) {
      secrets[id] = apiKey
    }

    return {
      ...p,
      apiKey: type === 'ollama' ? apiKey : '',
    }
  })

  const sanitized = {
    ...persisted,
    state: {
      ...state,
      providers,
    },
  }

  return { sanitized: savePersisted(sanitized), secrets }
}

function sanitizeTTSPersistedAndExtractSecrets(raw: string): { sanitized: string; volcengine: { appid: string; token: string } } | null {
  const persisted = loadPersisted<any>(raw)
  if (!persisted || typeof persisted !== 'object') return null
  const state = persisted.state
  if (!state || typeof state !== 'object') return null
  const ttsConfig = state.ttsConfig
  if (!ttsConfig || typeof ttsConfig !== 'object') return null
  const volcengine = ttsConfig.volcengine
  if (!volcengine || typeof volcengine !== 'object') return null

  const appid = typeof volcengine.appid === 'string' ? volcengine.appid : ''
  const token = typeof volcengine.token === 'string' ? volcengine.token : ''

  const sanitized = {
    ...persisted,
    state: {
      ...state,
      ttsConfig: {
        ...ttsConfig,
        volcengine: {
          ...volcengine,
          appid: '',
          token: '',
        },
      },
    },
  }

  return {
    sanitized: savePersisted(sanitized),
    volcengine: { appid, token },
  }
}

function mergeSecretsIntoLocalSecretPersist(existingRaw: string | null, secrets: Record<string, string>): string {
  const existing = existingRaw ? loadPersisted<any>(existingRaw) : null
  const existingState = existing?.state && typeof existing.state === 'object' ? existing.state : {}
  const existingMap = existingState.apiKeysByProviderId && typeof existingState.apiKeysByProviderId === 'object'
    ? existingState.apiKeysByProviderId
    : {}

  return savePersisted({
    state: {
      apiKeysByProviderId: {
        ...existingMap,
        ...secrets,
      },
    },
    version: 1,
  })
}

async function maybeMigrateFromLocalStorage(name: string, primary: StateStorage): Promise<string | null> {
  if (!isBrowser()) return null
  if (!window.localStorage) return null

  const localRaw = window.localStorage.getItem(name)
  if (!localRaw) return null

  // Special handling: llm-storage used to include API keys. We migrate non-secret fields to file,
  // and move API keys into a separate localStorage record.
  if (name === 'llm-storage') {
    const result = sanitizeLLMPersistedAndExtractSecrets(localRaw)
    if (!result) {
      // If we cannot safely parse & sanitize, do not migrate.
      return null
    }

    const existingSecretRaw = window.localStorage.getItem('llm-secret-storage')
    window.localStorage.setItem(
      'llm-secret-storage',
      mergeSecretsIntoLocalSecretPersist(existingSecretRaw, result.secrets)
    )

    await primary.setItem(name, result.sanitized)
    window.localStorage.removeItem(name)
    return result.sanitized
  }

  // Special handling: tts-storage used to include volcengine appid/token.
  if (name === 'tts-storage') {
    const result = sanitizeTTSPersistedAndExtractSecrets(localRaw)
    if (!result) {
      return null
    }

    const existingSecretRaw = window.localStorage.getItem('tts-secret-storage')
    const existing = existingSecretRaw ? loadPersisted<any>(existingSecretRaw) : null
    const existingState = existing?.state && typeof existing.state === 'object' ? existing.state : {}
    const existingVolc = existingState.volcengine && typeof existingState.volcengine === 'object' ? existingState.volcengine : {}

    window.localStorage.setItem(
      'tts-secret-storage',
      savePersisted({
        state: {
          volcengine: {
            appid: typeof existingVolc.appid === 'string' ? existingVolc.appid : '',
            token: typeof existingVolc.token === 'string' ? existingVolc.token : '',
            ...(result.volcengine.appid ? { appid: result.volcengine.appid } : {}),
            ...(result.volcengine.token ? { token: result.volcengine.token } : {}),
          },
        },
        version: 1,
      })
    )

    await primary.setItem(name, result.sanitized)
    window.localStorage.removeItem(name)
    return result.sanitized
  }

  await primary.setItem(name, localRaw)
  window.localStorage.removeItem(name)
  return localRaw
}

export const settingsKVStorage: StateStorage = {
  getItem: async (name) => {
    const primary = getPrimaryStorage()

    let value = await primary.getItem(name)
    if (value == null) {
      value = await maybeMigrateFromLocalStorage(name, primary)
    }

    return value
  },
  setItem: async (name, value) => {
    const primary = getPrimaryStorage()
    await primary.setItem(name, value)
  },
  removeItem: async (name) => {
    const primary = getPrimaryStorage()
    await primary.removeItem(name)
  },
}

export function createSettingsJSONStorage() {
  return createJSONStorage(() => settingsKVStorage)
}

// Exported for route handler debugging or future migrations
export function _unsafe_parsePersistedKV(raw: string): PersistedKV | null {
  return loadPersisted<PersistedKV>(raw)
}

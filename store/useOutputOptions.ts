import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OutputOption, PromptOption } from "@/types/llm";
import { OUTPUT_TYPE, INPUT_PROMPT } from "@/constants/prompt";
import { message } from 'antd';
import generateUUID from '@/utils/uuid'
import { createSettingsJSONStorage } from '@/store/persistStorage'

function defaultSentenceOutputOption(): OutputOption[] {
  return [
    {
      id: generateUUID(),
      name: 'Sentence Analysis',
      type: OUTPUT_TYPE.SIMPLE_LIST,
      rulePrompt: INPUT_PROMPT.SENTENCE_STRUCTURE_ANALYSIS,
    },
    {
      id: generateUUID(),
      name: 'Sentence Rewrite',
      type: OUTPUT_TYPE.TEXT,
      rulePrompt: INPUT_PROMPT.SENTENCE_REWRITE,
    },
    {
      id: generateUUID(),
      name: 'Key Word Analysis',
      type: OUTPUT_TYPE.KEY_VALUE_LIST,
      rulePrompt: INPUT_PROMPT.EXTRACT_KEY_WORDS,
    },
    {
      id: generateUUID(),
      name: 'Sentence Simplification',
      type: OUTPUT_TYPE.MD,
      rulePrompt: INPUT_PROMPT.MD_SENTENCE_SIMPLIFICATION,
    }
  ]
}

interface OutputOptionsStore {
  sentenceOptions: OutputOption[]
  addSentenceOptions: (newOption: OutputOption) => void
  deleteSentenceOptions: (targetOption: OutputOption) => void
  updateSentenceOptions: (updatedOption: OutputOption) => void
  resetSentenceOptions: () => void
  batchProcessingSize: number
  setBatchProcessingSize: (size: number) => void

  promptOptions: PromptOption[]
  addPromptOptions: (newPrompt: PromptOption) => void
  deletePromptOptions: (targetPrompt: PromptOption) => void
  updatePromptOptions: (updatedPrompt: PromptOption) => void
  resetPromptOptions: () => void
  selectedId: string
  setSelectedId: (id: string) => void
}

function defaultPromptOutputOption(): PromptOption[] {
  return [
    {
      id: generateUUID(),
      name: 'default chat',
      prompt: INPUT_PROMPT.CHAT_PROMPT,
    }
  ]
}

export const useOutputOptions = create<OutputOptionsStore>()(
  persist(
    (set) => ({
      sentenceOptions: defaultSentenceOutputOption(),
      addSentenceOptions: (newOption) => set((state) => ({
        sentenceOptions: [...state.sentenceOptions, {
          ...newOption,
          id: generateUUID()
        }]
      })),
      deleteSentenceOptions: (targetOption) => set((state) => ({
        sentenceOptions: state.sentenceOptions.filter((option) => option.id !== targetOption.id)
      })),
      updateSentenceOptions: (updatedOption) => set((state) => ({
        sentenceOptions: state.sentenceOptions.map((option) =>
          option.id === updatedOption.id ? updatedOption : option)
      })),
      resetSentenceOptions: () => set(() => ({
        sentenceOptions: defaultSentenceOutputOption()
      })),
      batchProcessingSize: 1,
      setBatchProcessingSize: (size) => set({ batchProcessingSize: size }),

      promptOptions: defaultPromptOutputOption(),
      addPromptOptions: (newPrompt) => set((state) => ({
        promptOptions: [...state.promptOptions, {
          ...newPrompt,
          id: generateUUID()
        }]
      })),
      deletePromptOptions: (targetPrompt) => set((state) => {
        if (state.promptOptions.length === 1) {
          message.warning('至少保留一个提示词')
          return { promptOptions: state.promptOptions }
        }
        const newPromptOptions = state.promptOptions.filter((option) => option.id !== targetPrompt.id)
        message.success('删除成功')
        return {
          promptOptions: newPromptOptions,
        }
      }),
      updatePromptOptions: (updatedPrompt) => set((state) => ({
        promptOptions: state.promptOptions.map((option) =>
          option.id === updatedPrompt.id ? updatedPrompt : option)
      })),
      resetPromptOptions: () => set(() => ({
        promptOptions: defaultPromptOutputOption()
      })),
      selectedId: defaultPromptOutputOption()[0].id,
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    {
      name: 'output-options-storage',
      storage: createSettingsJSONStorage(),
      version: 1,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState as any
        const state = persistedState as Record<string, any>

        // Drop legacy word-processing fields.
        if (state.wordOptions) delete state.wordOptions
        if (state.selectedWordId) delete state.selectedWordId

        // Ensure selectedId exists.
        if (!state.selectedId) {
          state.selectedId = defaultPromptOutputOption()[0]?.id
        }

        return state as any
      },
    }
  )
)

export const getNewHistory = (promptOptions: PromptOption[], selectedId: string) => {
  return {
    id: generateUUID(),
    title: 'New Chat',
    timestamp: new Date().getTime(),
    prompt: promptOptions.find(option => option.id === selectedId)?.prompt || '',
    messages: []
  }
}
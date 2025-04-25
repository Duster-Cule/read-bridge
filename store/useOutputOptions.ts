import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OutputOption, PromptOption } from "@/types/llm";
import { OUTPUT_TYPE, INPUT_PROMPT } from "@/constants/prompt";
import { message } from 'antd';

function defaultSentenceOutputOption(): OutputOption[] {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Sentence Analysis',
      type: OUTPUT_TYPE.SIMPLE_LIST,
      rulePrompt: INPUT_PROMPT.SENTENCE_STRUCTURE_ANALYSIS,
    },
    {
      id: crypto.randomUUID(),
      name: 'Sentence Rewrite',
      type: OUTPUT_TYPE.TEXT,
      rulePrompt: INPUT_PROMPT.SENTENCE_REWRITE,
    },
    {
      id: crypto.randomUUID(),
      name: 'Key Word Analysis',
      type: OUTPUT_TYPE.KEY_VALUE_LIST,
      rulePrompt: INPUT_PROMPT.EXTRACT_KEY_WORDS,
    }
  ]
}

interface OutputOptionsStore {
  sentenceOptions: OutputOption[]
  addSentenceOptions: (newOption: OutputOption) => void
  deleteSentenceOptions: (targetOption: OutputOption) => void
  updateSentenceOptions: (updatedOption: OutputOption) => void
  promptOptions: PromptOption[]
  addPromptOptions: (newPrompt: PromptOption) => void
  deletePromptOptions: (targetPrompt: PromptOption) => void
  updatePromptOptions: (updatedPrompt: PromptOption) => void
  selectedId: string
  setSelectedId: (id: string) => void
}

function defaultPromptOutputOption(): PromptOption[] {
  return [
    {
      id: crypto.randomUUID(),
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
          id: crypto.randomUUID()
        }]
      })),
      deleteSentenceOptions: (targetOption) => set((state) => ({
        sentenceOptions: state.sentenceOptions.filter((option) => option.id !== targetOption.id)
      })),
      updateSentenceOptions: (updatedOption) => set((state) => ({
        sentenceOptions: state.sentenceOptions.map((option) =>
          option.id === updatedOption.id ? updatedOption : option)
      })),
      promptOptions: defaultPromptOutputOption(),
      addPromptOptions: (newPrompt) => set((state) => ({
        promptOptions: [...state.promptOptions, {
          ...newPrompt,
          id: crypto.randomUUID()
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
      selectedId: defaultPromptOutputOption()[0].id,
      setSelectedId: (id) => set({ selectedId: id })
    }),
    {
      name: 'output-options-storage',
    }
  )
)

export const getNewHistory = (promptOptions: PromptOption[], selectedId: string) => {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    timestamp: new Date().getTime(),
    prompt: promptOptions.find(option => option.id === selectedId)?.prompt || INPUT_PROMPT.CHAT_PROMPT,
    messages: []
  }
}
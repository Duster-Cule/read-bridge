
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OutputOption, PromptOption } from "@/types/llm";
import { OUTPUT_TYPE, OUTPUT_PROMPT, INPUT_PROMPT } from "@/constants/prompt";
function defaultSentenceOutputOption(): OutputOption[] {
  return [
    {
      name: 'Sentence Analysis',
      type: OUTPUT_TYPE.BULLET_LIST,
      rulePrompt: INPUT_PROMPT.SENTENCE_STRUCTURE_ANALYSIS,
      outputPrompt: OUTPUT_PROMPT.SIMPLE_LIST
    },
    {
      name: 'Sentence Rewrite',
      type: OUTPUT_TYPE.TEXT,
      rulePrompt: INPUT_PROMPT.SENTENCE_REWRITE,
      outputPrompt: OUTPUT_PROMPT.TEXT
    },
    {
      name: 'Key Word Analysis',
      type: OUTPUT_TYPE.KEY_VALUE_LIST,
      rulePrompt: INPUT_PROMPT.EXTRACT_KEY_WORDS,
      outputPrompt: OUTPUT_PROMPT.LIST
    }
  ]
}

function defaultPromptOutputOption(): PromptOption[] {
  return [
    {
      name: 'default chat',
      prompt: INPUT_PROMPT.CHAT_PROMPT,
    }
  ]
}

interface OutputOptionsStore {
  sentenceOptions: OutputOption[]
  addSentenceOptions: (options: OutputOption) => void
  deleteSentenceOptions: (options: OutputOption) => void
  updateSentenceOptions: (options: OutputOption) => void
  promptOptions: PromptOption[]
  addPromptOptions: (options: PromptOption) => void
  deletePromptOptions: (options: PromptOption) => void
  updatePromptOptions: (options: PromptOption) => void
}

export const useOutputOptions = create<OutputOptionsStore>()(
  persist(
    (set) => ({
      sentenceOptions: defaultSentenceOutputOption(),
      addSentenceOptions: (options) => set((state) => ({ sentenceOptions: [...state.sentenceOptions, options] })),
      deleteSentenceOptions: (options) => set((state) => ({ sentenceOptions: state.sentenceOptions.filter((option) => option.name !== options.name) })),
      updateSentenceOptions: (options) => set((state) => ({ sentenceOptions: state.sentenceOptions.map((option) => option.name === options.name ? options : option) })),
      promptOptions: defaultPromptOutputOption(),
      addPromptOptions: (options) => set((state) => ({ promptOptions: [...state.promptOptions, options] })),
      deletePromptOptions: (options) => set((state) => ({ promptOptions: state.promptOptions.filter((option) => option.name !== options.name) })),
      updatePromptOptions: (options) => set((state) => ({ promptOptions: state.promptOptions.map((option) => option.name === options.name ? options : option) })),
    }),
    {
      name: 'output-options-storage',
    }
  )
)

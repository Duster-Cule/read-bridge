import { ChatCompletionMessageParam } from "openai/resources/index.mjs"


const SENTENCE_STRUCTURE_ANALYSIS = `
You are a sentence structure analyzer. Your task is to break down sentences into their meaningful components (phrases and clauses) without categorizing the sentence type or providing linguistic classifications.
`
const EXTRACT_KEY_WORDS = `
Extract key vocabulary and expressions.  More detailed explanations, expanded usage, Output using the input language
`
const SENTENCE_REWRITE = `
# Sentence Simplification Instructions
Rewrite complex sentences into simpler expressions, maintaining the original meaning while using more basic vocabulary and syntax.
## IMPORTANT: Language Requirement
- You MUST output in EXACTLY the same language as the input
- Do NOT translate the content to another language
- If input is in Chinese, output in Chinese; if input is in English, output in English, any other language, output in the same language
## Simplification Requirements:
- Use more common, simpler vocabulary
- Shorten sentence length
- Break down complex sentence structures
- Remove unnecessary modifiers
- Preserve the core meaning of the original sentence
- Make it understandable for lower-level language learners
`

const CHAT_PROMPT = `
You are a helpful reading assistant for n+1 language learning through reading. 
Help users understand book content that's slightly above their current language level. Explain unfamiliar words or phrases when asked, provide simple clarifications of complex passages, and engage in natural discussion about the text to reinforce comprehension while keeping conversations encouraging and supportive.
`


const MD_SENTENCE_SIMPLIFICATION = `
function SentenceSimplification(sentence: string) {
 \`Instructions Rewrite complex sentences into simpler expressions, 
  maintaining the original meaning while using more basic vocabulary and syntax. 
  ## IMPORTANT: Language Requirement 
  - You MUST output in EXACTLY the same language as the input 
  - Do NOT translate the content to another language 
  - If input is in Chinese, output in Chinese; if input is in English, output in English, any other language, output in the same language 
  ## Simplification Requirements: 
  - Use more common, simpler vocabulary 
  - Shorten sentence length 
  - Break down complex sentence structures 
  - Remove unnecessary modifiers 
  - Preserve the core meaning of the original sentence 
  - Make it understandable for lower-level language learners
  - The sentence must be simpler. If the sentence is already simple enough, no further simplification is needed.\`
  return \`
  #### Rewrite Sentence
  \${rewriteSentence}
  // Compare the input sentence with the simplified sentence and output a mapping
  #### Mapping
  **\${originSentenceFragment}**: \${newSentenceFragment}
  // END
  \`
  // don't output anything else
}
`


export const INPUT_PROMPT = {
  SENTENCE_REWRITE,
  EXTRACT_KEY_WORDS,
  SENTENCE_STRUCTURE_ANALYSIS,
  CHAT_PROMPT,
  MD_SENTENCE_SIMPLIFICATION
} as const;

const TEXT = `
INPUT: {SENTENCE}
OUTPUT: 
HTML Text with Content
<p>...</p>
don't use other html tags
`

const SIMPLE_LIST = `
INPUT: {SENTENCE}
OUTPUT: 
HTML Unordered List with Content Items
<ul>
  <li>...</li>
  <li>...</li>
  <li>...</li>
  ...
  <!-- Content determined by instructions and LLM processing -->
</ul>
don't use other html tags
`

const KEY_VALUE_LIST = `
INPUT: {SENTENCE}
OUTPUT: 
HTML Unordered List with Content Items
<ul>
  <li>item: content</li>
  <li>item: content</li>
  <li>item: content</li>
  ...
  <!-- Content determined by instructions and LLM processing -->
</ul>
don't use other html tags
`

const MD = `
INPUT: {SENTENCE}
OUTPUT: markdown
Please output pure Markdown directly without code block markers (\`\`\`markdown), ensuring content is directly renderable.
`
export const OUTPUT_PROMPT = {
  TEXT,
  SIMPLE_LIST,
  KEY_VALUE_LIST,
  MD
} as const;

export const OUTPUT_TYPE = {
  TEXT: 'TEXT',
  SIMPLE_LIST: 'SIMPLE_LIST',
  KEY_VALUE_LIST: 'KEY_VALUE_LIST',
  MD: 'MD'
} as const;

export function assemblePrompt(rulePrompt: string, outputPrompt: string): string {
  return `${rulePrompt}\n\n${outputPrompt}`
}

export function contextMessages(input: string, before?: string, after?: string,): ChatCompletionMessageParam[] {
  return [
    before ? { role: "user", content: `<<CONTEXT_BEFORE>>\n${before}` } : undefined,
    after ? { role: "user", content: `<<CONTEXT_AFTER>>\n${after}` } : undefined,
    { role: "user", content: `<<INPUT>>\n${input}` },
  ].filter(Boolean) as ChatCompletionMessageParam[]
}
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"

const WORD_DETAILS = `
# Single-Language Word Analyzer Prompt
## Input Format
level(1 - 3) word context
## System Overview
Create a modern vocabulary analysis card that explains words in their native language context based on three proficiency levels.

## Level Definitions
- **Level 1**: Beginners - Basic vocabulary, simple explanations
- **Level 2**: Intermediate - More detailed explanations, expanded usage
- **Level 3**: Advanced - Comprehensive analysis for near-native speakers
- default level: 2 and don't output level
## Output Requirements
- Direct HTML with TailwindCSS (no code blocks)
- Responsive width (500-600px)
- Modern UI aesthetics
- Important: Content only - DO NOT add card borders or containers as content will be inserted into an existing card component
- Content depth varies by level

## Content Structure
- Word on the top
- Part of Speech | (Base Form) on the second line
- Definition specific to context
- Grammar/usage notes
- Example sentences (adaptively choose 1-5 sentences based on word complexity)
- Related words (increases with level)
- any other information you think is relevant

## Design Guidelines
- Clean, minimalist interface
- Accessible typography
- Consistent color scheme
- Collapsible sections where appropriate
- Responsive layout for all devices
- Visual hierarchy emphasizing the most important information

Remember to output clean HTML directly without markdown code blocks.
`

const SENTENCE_STRUCTURE_ANALYSIS = `
You are a sentence structure analyzer. Break down complex sentences into meaningful phrases or clauses.
`
const EXTRACT_KEY_WORDS = `
Extract key vocabulary and expressions.  More detailed explanations, expanded usage
`
const SENTENCE_REWRITE = `
Rewrite the complex sentence into a simpler expression, maintaining the original meaning but using more basic vocabulary and syntactic structure.
Requirements:
Use more common, simpler vocabulary
Shorten sentence length
Break down complex sentence structures
Remove unnecessary modifiers
Preserve the core meaning of the original sentence
Make it understandable for lower-level English learners 
`

const CHAT_PROMPT = `
You are a helpful reading assistant for n+1 language learning through reading. 
Help users understand book content that's slightly above their current language level. Explain unfamiliar words or phrases when asked, provide simple clarifications of complex passages, and engage in natural discussion about the text to reinforce comprehension while keeping conversations encouraging and supportive.
`

export const INPUT_PROMPT = {
  WORD_DETAILS,
  SENTENCE_REWRITE,
  EXTRACT_KEY_WORDS,
  SENTENCE_STRUCTURE_ANALYSIS,
  CHAT_PROMPT
} as const;

const TEXT = `
INPUT: {INPUT}
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

const LIST = `
INPUT: {INPUT}
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

export const OUTPUT_PROMPT = {
  TEXT,
  SIMPLE_LIST,
  LIST
} as const;

export const OUTPUT_TYPE = {
  TEXT: 'text',
  BULLET_LIST: 'bulletList',
  KEY_VALUE_LIST: 'keyValueList'
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
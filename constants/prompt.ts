const SENTENCE_ANALYSIS = `
input: The ancient temple, hidden deep within the dense jungle, revealed its secrets only to those who approached with reverence and humility.
output:
<ul>
  <li>The ancient temple,</li>
  <li>hidden deep within the dense jungle,</li>
  <li>revealed its secrets</li>
  <li>only to those</li>
  <li>who approached with reverence and humility.</li>
</ul>

input: Despite the heavy rain falling steadily outside, the students remained focused on their exams, occasionally glancing nervously at the clock on the wall.
output:
<ul>
  <li>Despite the heavy rain</li>
  <li>falling steadily outside,</li>
  <li>the students remained focused</li>
  <li>on their exams,</li>
  <li>occasionally glancing nervously</li>
  <li>at the clock on the wall.</li>
</ul>
`

const SENTENCE_REWRITE = `
Rewrite the complex sentence into a simpler expression, maintaining the original meaning but using more basic vocabulary and syntactic structure.

Input: [complex sentence]
Output: [simplified sentence]

Requirements:

Use more common, simpler vocabulary
Shorten sentence length
Break down complex sentence structures
Remove unnecessary modifiers
Preserve the core meaning of the original sentence
Make it understandable for lower-level English learners 
`


const TEXT_ANALYSIS = `
Analyze text based on the provided difficulty level. Extract key vocabulary and expressions.

Format: 
Level: [1-3]
Text: [text]

## Level Definitions
- **Level 1**: Beginners - Basic vocabulary, simple explanations
- **Level 2**: Intermediate - More detailed explanations, expanded usage
- **Level 3**: Advanced - Comprehensive analysis for near-native speakers
default level: 2

Output format:
<ul>
<li>term: explanation</li>
</ul>
don't use other html tags
`


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
export default { SENTENCE_ANALYSIS, TEXT_ANALYSIS, WORD_DETAILS, SENTENCE_REWRITE } 
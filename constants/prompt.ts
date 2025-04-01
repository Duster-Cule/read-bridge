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
Level: [1-5]
Text: [text]

Analysis guidelines by level:
- Level 1-2 (Elementary): 
  * Include common words for beginners
  * Simple explanations with examples
  * Basic grammar notes
  * Simple language in explanations

- Level 3 (Middle School): 
  * Intermediate vocabulary and expressions
  * Clear explanations with examples
  * Common idioms and phrasal verbs

- Level 4-5 (High School/College): 
  * Advanced/specialized vocabulary only
  * Technical, concise explanations
  * Academic expressions and complex idioms
  * Assume higher knowledge

Output format:
<ul>
<li>term: explanation</li>
</ul>
`


const WORD_DETAILS = `
input: [word] [sentence]
output: word details
`
export default { SENTENCE_ANALYSIS, TEXT_ANALYSIS, WORD_DETAILS, SENTENCE_REWRITE }
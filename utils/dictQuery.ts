export function normalizeDictQuery(raw: string): string {
  const text = String(raw ?? '').trim()
  if (!text) return ''

  // Normalize common typography differences.
  const normalized = text
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')

  // Keep common word-internal punctuation (apostrophes, hyphens), but trim them at edges.
  const trimmed = normalized
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/[^A-Za-z0-9]+$/, '')
    .replace(/^[\-_'’]+/, '')
    .replace(/[\-_'’]+$/, '')

  // Avoid huge payloads / accidental multi-word queries.
  if (!trimmed || trimmed.length > 64 || /\s/.test(trimmed)) return ''
  return trimmed.toLowerCase()
}

export function summarizeExtractive(text: string, sentenceCount = 3): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''

  const sentences = clean
    .split(/(?<=[.!?。！？]|다\.|요\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length <= sentenceCount) return sentences.join(' ')

  const tokens = clean
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)

  const freq = new Map<string, number>()
  tokens.forEach((t) => freq.set(t, (freq.get(t) || 0) + 1))

  const scored = sentences.map((s, idx) => {
    const words = s
      .toLowerCase()
      .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
    const score = words.reduce((acc, w) => acc + (freq.get(w) || 0), 0) / Math.max(1, words.length)
    return { idx, s, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.idx - b.idx)
    .map((v) => v.s)
    .join(' ')
}

export function buildPostSummaries(content: string) {
  const short = summarizeExtractive(content, 3)
  const long = summarizeExtractive(content, 7)
  return { summaryShort: short, summaryLong: long }
}

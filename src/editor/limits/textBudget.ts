import type { NoteBlock } from '../model/noteBlock'
import type { ContentLimits } from './limits'

export const blockText = (block: NoteBlock) => block.content?.map(part => part.text).join('') ?? ''

export function safeEnd(text: string, end: number): number {
  const previous = text.charCodeAt(end - 1)
  const next = text.charCodeAt(end)
  return previous >= 0xd800 && previous <= 0xdbff && next >= 0xdc00 && next <= 0xdfff
    ? end - 1 : end
}

export function splitEnds(text: string, max: number): number[] {
  if (!text.length) return [0]
  const ends: number[] = []
  let start = 0
  while (start < text.length) {
    const end = safeEnd(text, Math.min(start + max, text.length))
    if (end === start) break
    ends.push(end)
    start = end
  }
  return ends
}

export function fitsContent(texts: readonly string[], limits: ContentLimits): boolean {
  let characters = 0
  let blocks = 0
  for (const text of texts) {
    characters += text.length
    if (characters > limits.maxNoteCharacters) return false
    const ends = splitEnds(text, limits.maxBlockCharacters)
    blocks += ends.length
    if (ends.at(-1) !== text.length || blocks > limits.maxBlocks) return false
  }
  return true
}

export type TextPart = { index: number; start: number; end: number }

// Loading / lowering limits retains a prefix. Editing uses fitsContent instead.
export function planContent(texts: readonly string[], limits: ContentLimits, attachments: readonly boolean[] = []): TextPart[] {
  const parts: TextPart[] = []
  let remaining = limits.maxNoteCharacters
  for (const [index, text] of texts.entries()) {
    if (attachments[index]) {
      if (parts.length === limits.maxBlocks) return parts
      parts.push({ index, start: 0, end: 0 })
      continue
    }
    let start = 0
    do {
      if (!remaining || parts.length === limits.maxBlocks) return parts
      const end = safeEnd(text, Math.min(text.length, start + limits.maxBlockCharacters, start + remaining))
      // Keep the first block editable even when its first character cannot fit.
      if (end === start && text.length > start) {
        if (!parts.length) parts.push({ index, start, end })
        return parts
      }
      parts.push({ index, start, end })
      remaining -= end - start
      start = end
    } while (start < text.length)
  }
  return parts
}

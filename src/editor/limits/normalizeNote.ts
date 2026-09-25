import { createId } from '../../shared/ids'
import { createEmptyNote } from '../model/createEmptyNote'
import { defaultBlockProps, isAttachmentType, type NoteDocument } from '../model/noteBlock'
import { resolveLimits, type ContentLimits } from './limits'
import { blockText, planContent } from './textBudget'

export function normalizeNote(
  document: NoteDocument,
  options: Partial<ContentLimits> = {},
  generateId = createId,
): NoteDocument {
  if (!document.length) return createEmptyNote(generateId)
  const texts = document.map(blockText)
  const parts = planContent(texts, resolveLimits(options), document.map(block => isAttachmentType(block.type)))
  if (parts.length === document.length && parts.every((part, index) =>
    part.index === index && part.start === 0 && part.end === texts[index].length)) return document
  const usedIds = new Set(document.map(block => block.id))
  const nextId = () => {
    let id = generateId()
    while (usedIds.has(id)) id = generateId()
    usedIds.add(id)
    return id
  }
  return parts.map(({ index, start, end }) => {
    const original = document[index]
    if (original.type === 'image' || original.type === 'file') return structuredClone(original)
    const text = texts[index].slice(start, end)
    const content = text ? [{ type: 'text' as const, text, styles: {} }] : []
    return start === 0
      ? { ...structuredClone(original), content }
      : { id: nextId(), type: 'paragraph', props: { ...defaultBlockProps }, content, children: [] }
  })
}

import type { JSONContent } from '@tiptap/core'
import { defaultBlockProps } from './noteBlock'
import type { NoteDocument } from './noteBlock'
import { validateNote } from './validateNote'

export function tiptapToBlocks(document: JSONContent): NoteDocument {
  if (document.type !== 'doc' || !Array.isArray(document.content)) {
    throw new Error('Некорректный документ Tiptap: doc.content')
  }
  const blocks = document.content.map((node, index) => {
    const path = `blocks[${index}]`
    if (node.type !== 'paragraph' && node.type !== 'heading') {
      throw new Error(`Неподдерживаемый узел: ${path}.type`)
    }
    if (node.marks?.length) throw new Error(`Неподдерживаемые marks: ${path}`)
    const text = (node.content ?? []).map((part, partIndex) => {
      if (part.type !== 'text' || typeof part.text !== 'string' || part.marks?.length || part.content) {
        throw new Error(`Неподдерживаемый текст: ${path}.content[${partIndex}]`)
      }
      return part.text
    }).join('')
    return {
      id: node.attrs?.id,
      type: node.type,
      props: node.type === 'heading'
        ? { ...defaultBlockProps, level: node.attrs?.level, isToggleable: false }
        : { ...defaultBlockProps },
      content: text ? [{ type: 'text', text, styles: {} }] : [],
      children: [],
    }
  })
  validateNote(blocks)
  return blocks
}

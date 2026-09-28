import type { JSONContent } from '@tiptap/core'
import type { NoteDocument } from './noteBlock'
import { validateNote } from './validateNote'

export function blocksToTiptap(blocks: NoteDocument): JSONContent {
  validateNote(blocks)
  return {
    type: 'doc',
    content: blocks.map((block) => {
      if (block.type === 'image' || block.type === 'file') {
        return {
          type: block.type,
          attrs: {
            id: block.id,
            url: block.props.url,
            name: block.props.name,
            caption: block.props.caption,
          },
        }
      }
      const text = block.content.map((part) => part.text).join('')
      return {
        type: block.type,
        attrs: block.type === 'heading'
          ? { id: block.id, level: block.props.level }
          : { id: block.id },
        content: text ? [{ type: 'text', text }] : [],
      }
    }),
  }
}

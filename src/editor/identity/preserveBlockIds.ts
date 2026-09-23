import type { Command } from '@tiptap/core'

// Paragraph/heading changes keep the text and top-level block positions intact.
export function preserveBlockIds(command: Command): Command {
  return (props) => {
    const { tr, dispatch } = props
    const identities: { pos: number; id: string }[] = []
    tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        if (typeof node.attrs.id === 'string') identities.push({ pos, id: node.attrs.id })
        return false
      }
    })
    const result = command(props)
    if (result && dispatch) {
      for (const { pos, id } of identities) {
        const node = tr.doc.nodeAt(pos)
        if (node && node.attrs.id !== id) tr.setNodeMarkup(pos, undefined, { ...node.attrs, id })
      }
    }
    return result
  }
}

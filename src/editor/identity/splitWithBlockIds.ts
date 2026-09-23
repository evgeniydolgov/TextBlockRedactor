import type { Command } from '@tiptap/core'

export function splitWithBlockIds(
  command: Command,
  generateId: () => string = () => crypto.randomUUID(),
): Command {
  return (props) => {
    const { tr, dispatch } = props
    const { $from } = tr.selection
    const id: unknown = $from.parent.attrs.id
    const start = $from.depth > 0 ? $from.before() : null
    const mappingStart = tr.mapping.maps.length
    const result = command(props)
    if (!result || !dispatch || start === null || typeof id !== 'string') return result

    const firstPos = tr.mapping.slice(mappingStart).map(start, -1)
    const first = tr.doc.nodeAt(firstPos)
    if (!first) return result
    const secondPos = firstPos + first.nodeSize
    const second = tr.doc.nodeAt(secondPos)
    if (!second) return result

    tr.setNodeMarkup(firstPos, undefined, { ...first.attrs, id })
    tr.setNodeMarkup(secondPos, undefined, { ...second.attrs, id: generateId() })
    return result
  }
}

import { Slice } from '@tiptap/pm/model'
import { textEnds } from './fitInsertion'

export function pasteEnds(slice: Slice): number[] {
  const ends: number[] = []
  slice.content.forEach((node, pos) => {
    if (node.isText) {
      for (const end of textEnds(node.textContent)) ends.push(pos + end)
    } else {
      // Opening an empty block is meaningful: it consumes a block slot.
      if (pos > 0 || !node.textContent.length) ends.push(pos + 1)
      for (const end of textEnds(node.textContent)) ends.push(pos + 1 + end)
      ends.push(pos + node.nodeSize)
    }
  })
  return ends
}

export function pastePrefix(slice: Slice, end: number): Slice {
  if (end === slice.content.size) return slice
  let openEnd = 0
  slice.content.forEach((node, pos) => {
    if (!node.isText && end > pos && end < pos + node.nodeSize) openEnd = 1
  })
  return new Slice(slice.content.cut(0, end), slice.openStart, openEnd)
}

import type { NoteBlock, NoteDocument } from '../../editor/model/noteBlock'

function sameContent(a: NoteBlock, b: NoteBlock) {
  if (a.type !== b.type) return false
  if (a.type === 'image' || a.type === 'file') {
    return Object.entries(a.props).every(([key, value]) => b.props[key as keyof typeof b.props] === value)
  }
  if (b.type === 'image' || b.type === 'file') return false
  if (a.type === 'heading' && b.type === 'heading'
    && (a.props.level !== b.props.level || a.props.isToggleable !== b.props.isToggleable)) return false
  return a.props.backgroundColor === b.props.backgroundColor
    && a.props.textColor === b.props.textColor
    && a.props.textAlignment === b.props.textAlignment
    && a.content.map(part => part.text).join('') === b.content.map(part => part.text).join('')
}

export function diffBlocks(previous: NoteDocument, current: NoteDocument) {
  const oldById = new Map(previous.map(block => [block.id, block]))
  const currentIds = new Set(current.map(block => block.id))
  return {
    deleted: previous.filter(block => !currentIds.has(block.id)).map(block => block.id),
    updated: current.filter(block => {
      const old = oldById.get(block.id)
      return old !== undefined && !sameContent(old, block)
    }),
    createdIds: new Set(current.filter(block => !oldById.has(block.id)).map(block => block.id)),
  }
}

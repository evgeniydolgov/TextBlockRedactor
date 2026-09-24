import type { NoteDocument } from '../../editor/model/noteBlock'
import { diffBlocks } from './diffBlocks'
import type { BlockRequest } from './types'

export function buildBlockRequests(previous: NoteDocument, current: NoteDocument, noteId?: string): BlockRequest[] {
  const { deleted, updated, createdIds } = diffBlocks(previous, current)
  const context = noteId === undefined ? {} : { noteId }
  const requests: BlockRequest[] = []
  if (deleted.length === 1) {
    requests.push({ method: 'DELETE', path: `/blocks/${encodeURIComponent(deleted[0])}` })
  } else if (deleted.length > 1) {
    requests.push({ method: 'POST', path: '/blocks/list', body: { operation: 'DELETE', ids: deleted, ...context } })
  }
  for (const block of updated) {
    requests.push({ method: 'PUT', path: `/blocks/${encodeURIComponent(block.id)}`, body: block })
  }
  for (let index = 0; index < current.length;) {
    if (!createdIds.has(current[index].id)) {
      index++
      continue
    }
    const start = index
    while (index < current.length && createdIds.has(current[index].id)) index++
    const blocks = current.slice(start, index)
    const position = { before: current[start - 1]?.id ?? null, after: current[index]?.id ?? null }
    requests.push(blocks.length === 1
      ? { method: 'POST', path: '/blocks', body: { block: blocks[0], position } }
      : { method: 'POST', path: '/blocks/list', body: { operation: 'CREATE', blocks, position, ...context } })
  }
  return structuredClone(requests)
}

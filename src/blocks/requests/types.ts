import type { NoteBlock } from '../../editor/model/noteBlock'

export type BlockPositionForRequest = { before?: string | null; after?: string | null }
export type CreateBlockRequest = { block: NoteBlock; position?: BlockPositionForRequest }
export type BlocksListRequest = {
  operation: 'CREATE' | 'DELETE'
  blocks?: NoteBlock[]
  ids?: string[]
  position?: BlockPositionForRequest
  noteId?: string
}

export type BlockRequest =
  | { method: 'POST'; path: '/blocks'; body: CreateBlockRequest }
  | { method: 'POST'; path: '/blocks/list'; body: BlocksListRequest }
  | { method: 'PUT'; path: `/blocks/${string}`; body: NoteBlock }
  | { method: 'DELETE'; path: `/blocks/${string}`; body?: never }

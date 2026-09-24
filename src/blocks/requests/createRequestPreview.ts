import type { NoteDocument } from '../../editor/model/noteBlock'
import { buildBlockRequests } from './buildBlockRequests'

export function createRequestPreview(initialDocument: NoteDocument, noteId?: string) {
  let previous = structuredClone(initialDocument)
  return (current: NoteDocument) => {
    const requests = buildBlockRequests(previous, current, noteId)
    previous = structuredClone(current)
    return requests
  }
}

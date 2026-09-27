import type { NoteDocument } from '../../editor/model/note/noteBlock'
import { buildBlockRequests } from './buildBlockRequests'

export function createRequestPreview(initialDocument: NoteDocument, noteId?: string) {
  let previous = structuredClone(initialDocument)
  return (current: NoteDocument) => {
    const requests = buildBlockRequests(previous, current, noteId)
    // сейчас работает синхронно но потом должно перезаписывать только 
    // после обновления бэкенда
    previous = structuredClone(current)
    return requests
  }
}

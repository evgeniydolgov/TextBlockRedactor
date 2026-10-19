import type { NoteDocument } from '../../editor/model/note/noteBlock'
import type { SaveResult } from './storage/noteStorage'

type Queue = { update: (document: NoteDocument) => void }

export function createPutSyncAutosave(
  saveNote: (document: NoteDocument) => SaveResult,
  getQueue: () => Queue | null,
) {
  return (document: NoteDocument) => {
    const result = saveNote(document)
    if (result.error === null) getQueue()?.update(document)
    return result
  }
}

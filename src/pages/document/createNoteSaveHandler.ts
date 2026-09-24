import type { NoteDocument } from '../../editor/model/noteBlock'
import { logNoteBlocks } from './logNoteBlocks'
import type { SaveResult } from './storage/noteStorage'

export function createNoteSaveHandler(
  save: (document: NoteDocument) => SaveResult,
  reportError: (error: string | null) => void,
) {
  return (document: NoteDocument) => {
    const result = save(document)
    reportError(result.error)
    logNoteBlocks(document)
  }
}

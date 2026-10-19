import type { NoteDocument } from '../../editor/model/note/noteBlock'
import { logNoteBlocks } from './logNoteBlocks'
import type { SaveResult } from './storage/noteStorage'
import { NOTE_STORAGE_KEY } from './storage/noteStorage'
import type { BlockRequest } from '../../blocks/requests/types'
import type { SaveCycle } from './storage/requestLogStorage'
import { logBlockRequests } from './logBlockRequests'

type PreviewDependencies = {
  preview: (document: NoteDocument) => BlockRequest[]
  recordCycle: (cycle: SaveCycle) => void
}

export function createNoteSaveHandler(
  save: (document: NoteDocument) => SaveResult,
  reportError: (error: string | null) => void,
  diagnostics?: PreviewDependencies,
) {
  return (document: NoteDocument) => {
    const result = save(document)
    reportError(result.error)
    logNoteBlocks(document)
    if (diagnostics) {
      const requests = diagnostics.preview(document)
      logBlockRequests(requests)
      diagnostics.recordCycle({ requests, storage: {
        key: NOTE_STORAGE_KEY, data: structuredClone(document),
        success: result.error === null, error: result.error,
      } })
    }
    return result
  }
}

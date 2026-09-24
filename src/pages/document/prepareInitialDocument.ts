import type { NoteDocument } from '../../editor/model/noteBlock'
import { createEmptyNote } from '../../editor/model/createEmptyNote'

export function prepareInitialDocument(document: NoteDocument): NoteDocument {
  return document.length ? document : createEmptyNote()
}

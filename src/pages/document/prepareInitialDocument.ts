import type { NoteDocument } from '../../editor/model/note/noteBlock'
import { normalizeNote } from '../../editor/limits/core/normalizeNote'
import type { ContentLimits } from '../../editor/limits/core/limits'

export function prepareInitialDocument(document: NoteDocument, limits?: Partial<ContentLimits>): NoteDocument {
  return normalizeNote(document, limits)
}

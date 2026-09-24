import type { NoteDocument } from '../../editor/model/noteBlock'
import { normalizeNote } from '../../editor/limits/normalizeNote'
import type { ContentLimits } from '../../editor/limits/limits'

export function prepareInitialDocument(document: NoteDocument, limits?: Partial<ContentLimits>): NoteDocument {
  return normalizeNote(document, limits)
}

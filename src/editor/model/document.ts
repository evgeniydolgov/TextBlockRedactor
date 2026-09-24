import type { NoteDocument } from './noteBlock'
import type { ContentLimits } from '../limits/limits'

export type TextEditorProps = Partial<ContentLimits> & {
  initialContent?: NoteDocument
  onChange?: (document: NoteDocument) => void
  saveDelayMs?: number
}

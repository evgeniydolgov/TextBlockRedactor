import type { NoteDocument } from './noteBlock'
import type { ContentLimits } from '../limits/limits'
import type { ImageStorageAdapter } from '../images/imageStorage'

export type TextEditorProps = Partial<ContentLimits> & {
  initialContent?: NoteDocument
  onChange?: (document: NoteDocument) => void
  saveDelayMs?: number
  imageStorage?: ImageStorageAdapter
}

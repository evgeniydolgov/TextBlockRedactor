import type { NoteDocument } from './note/noteBlock'
import type { ContentLimits } from '../limits/core/limits'
import type { ImageStorageAdapter } from '../images/imageStorage'
import type { FileStorageAdapter } from '../files/fileStorage'

export type TextEditorProps = Partial<ContentLimits> & {
  initialContent?: NoteDocument
  onChange?: (document: NoteDocument) => void
  saveDelayMs?: number
  imageStorage?: ImageStorageAdapter
  fileStorage?: FileStorageAdapter
}

import type { NoteDocument } from './noteBlock'

export type TextEditorProps = {
  initialContent?: NoteDocument
  onChange?: (document: NoteDocument) => void
  saveDelayMs?: number
}

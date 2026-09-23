import type { JSONContent } from '@tiptap/core'

export type TextEditorProps = {
  initialContent?: JSONContent
  onChange?: (document: JSONContent) => void
}

export const emptyDocument: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

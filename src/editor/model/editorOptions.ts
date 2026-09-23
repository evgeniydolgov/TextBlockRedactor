import type { Editor } from '@tiptap/core'
import { emptyDocument } from './document'
import type { TextEditorProps } from './document'

export function createEditorOptions({ initialContent = emptyDocument, onChange }: TextEditorProps) {
  return {
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'editor-content',
        role: 'textbox',
        'aria-label': 'Текст документа',
        'aria-multiline': 'true',
        'aria-describedby': 'editor-hint',
      },
    },
    onUpdate: ({ editor }: { editor: Pick<Editor, 'getJSON'> }) => onChange?.(editor.getJSON()),
  }
}

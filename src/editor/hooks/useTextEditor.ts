import { useEditor } from '@tiptap/react'
import { editorExtensions } from '../extensions'
import { emptyDocument } from '../model/document'
import type { TextEditorProps } from '../model/document'

export function useTextEditor({ initialContent = emptyDocument, onChange }: TextEditorProps) {
  return useEditor({
    extensions: editorExtensions,
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
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  })
}

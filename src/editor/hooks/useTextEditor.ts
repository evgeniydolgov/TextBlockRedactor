import { useEditor } from '@tiptap/react'
import { editorExtensions } from '../extensions'
import { createEditorOptions } from '../model/editorOptions'
import type { TextEditorProps } from '../model/document'

export function useTextEditor(props: TextEditorProps) {
  return useEditor({
    extensions: editorExtensions,
    ...createEditorOptions(props),
  })
}

import { useEditor } from '@tiptap/react'
import { useState } from 'react'
import { editorExtensions } from '../extensions'
import { createEditorOptions, createUpdateHandler } from '../model/editorOptions'
import type { TextEditorProps } from '../model/document'

export function useTextEditor(props: TextEditorProps) {
  const [initialOptions] = useState(() => createEditorOptions(props))
  return useEditor({
    extensions: editorExtensions,
    ...initialOptions,
    onUpdate: createUpdateHandler(props.onChange),
  })
}

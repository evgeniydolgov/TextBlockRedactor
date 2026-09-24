import { useEditor } from '@tiptap/react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { createEditorExtensions } from '../extensions'
import { createLimitController } from '../limits/limitController'
import { createEditorOptions, createUpdateHandler } from '../model/editorOptions'
import type { TextEditorProps } from '../model/document'
import { createDebouncedChange } from '../model/createDebouncedChange'
import { bindSaveLifecycle } from '../model/bindSaveLifecycle'

export function useTextEditor(props: TextEditorProps) {
  const [changes] = useState(() => createDebouncedChange(props.onChange, props.saveDelayMs))
  const [initialOptions] = useState(() => createEditorOptions(props))
  const [limits] = useState(() => createLimitController(props))
  const [extensions] = useState(() => createEditorExtensions(limits))

  useLayoutEffect(() => {
    changes.configure(props.onChange, props.saveDelayMs)
  }, [changes, props.onChange, props.saveDelayMs])

  useEffect(() => bindSaveLifecycle(changes.flush, window, document), [changes])

  const editor = useEditor({
    extensions,
    ...initialOptions,
    onUpdate: createUpdateHandler(props.onChange ? changes.schedule : undefined),
  })

  const { maxBlockCharacters, maxNoteCharacters, maxBlocks } = props
  useLayoutEffect(() => {
    if (!editor) return
    const tr = limits.configure({ maxBlockCharacters, maxNoteCharacters, maxBlocks }, editor.state)
    if (tr) editor.view.dispatch(tr)
  }, [editor, limits, maxBlockCharacters, maxNoteCharacters, maxBlocks])

  return editor
}

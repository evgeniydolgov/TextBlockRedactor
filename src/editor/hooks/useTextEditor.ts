import { useEditor } from '@tiptap/react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { editorExtensions } from '../extensions'
import { createEditorOptions, createUpdateHandler } from '../model/editorOptions'
import type { TextEditorProps } from '../model/document'
import { createDebouncedChange } from '../model/createDebouncedChange'
import { bindSaveLifecycle } from '../model/bindSaveLifecycle'

export function useTextEditor(props: TextEditorProps) {
  const [changes] = useState(() => createDebouncedChange(props.onChange, props.saveDelayMs))
  const [initialOptions] = useState(() => createEditorOptions(props))

  useLayoutEffect(() => {
    changes.configure(props.onChange, props.saveDelayMs)
  }, [changes, props.onChange, props.saveDelayMs])

  useEffect(() => bindSaveLifecycle(changes.flush, window, document), [changes])

  return useEditor({
    extensions: editorExtensions,
    ...initialOptions,
    onUpdate: createUpdateHandler(props.onChange ? changes.schedule : undefined),
  })
}

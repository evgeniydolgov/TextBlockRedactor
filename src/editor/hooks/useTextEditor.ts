import { useEditor } from '@tiptap/react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { createEditorExtensions } from '../extensions'
import { createLimitController } from '../limits/tiptap/limitController'
import { createEditorOptions, createUpdateHandler } from '../model/lifecycle/editorOptions'
import type { TextEditorProps } from '../model/document'
import { createDebouncedChange } from '../model/lifecycle/createDebouncedChange'
import { bindSaveLifecycle } from '../model/lifecycle/bindSaveLifecycle'
import { createImageStorageController } from '../images/imageStorage'
import { createFileStorageController } from '../files/fileStorage'

export function useTextEditor(props: TextEditorProps) {
  const [changes] = useState(() => createDebouncedChange(props.onChange, props.saveDelayMs))
  const [initialOptions] = useState(() => createEditorOptions(props))
  const [limits] = useState(() => createLimitController(props))
  const [imageStorage] = useState(() => createImageStorageController(props.imageStorage))
  const [fileStorage] = useState(() => createFileStorageController(props.fileStorage))
  const [extensions] = useState(() => createEditorExtensions(limits, imageStorage, fileStorage))

  useLayoutEffect(() => {
    changes.configure(props.onChange, props.saveDelayMs)
  }, [changes, props.onChange, props.saveDelayMs])

  useLayoutEffect(() => imageStorage.configure(props.imageStorage), [imageStorage, props.imageStorage])
  useLayoutEffect(() => fileStorage.configure(props.fileStorage), [fileStorage, props.fileStorage])

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

import type { Editor } from '@tiptap/core'
import { createEmptyNote } from './createEmptyNote'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'
import { validateNote } from './validateNote'
import type { TextEditorProps } from './document'

export function createUpdateHandler(onChange: TextEditorProps['onChange']) {
  return ({ editor }: { editor: Pick<Editor, 'getJSON'> }) => onChange?.(tiptapToBlocks(editor.getJSON()))
}

export function createEditorOptions({ initialContent, onChange }: TextEditorProps) {
  const blocks = initialContent === undefined ? [] : initialContent
  validateNote(blocks)
  return {
    content: blocksToTiptap(blocks.length ? blocks : createEmptyNote()),
    editorProps: {
      attributes: {
        class: 'editor-content',
        role: 'textbox',
        'aria-label': 'Текст документа',
        'aria-multiline': 'true',
        'aria-describedby': 'editor-hint',
      },
    },
    onUpdate: createUpdateHandler(onChange),
  }
}

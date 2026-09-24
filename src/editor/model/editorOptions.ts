import type { Editor } from '@tiptap/core'
import { normalizeNote } from '../limits/normalizeNote'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'
import { validateNote } from './validateNote'
import type { TextEditorProps } from './document'

export function createUpdateHandler(onChange: TextEditorProps['onChange']) {
  return ({ editor }: { editor: Pick<Editor, 'getJSON'> }) => onChange?.(tiptapToBlocks(editor.getJSON()))
}

export function createEditorOptions({ initialContent, onChange, ...limits }: TextEditorProps) {
  const blocks = initialContent === undefined ? [] : initialContent
  validateNote(blocks)
  return {
    content: blocksToTiptap(normalizeNote(blocks, limits)),
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

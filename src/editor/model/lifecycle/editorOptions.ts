import type { Editor } from '@tiptap/core'
import { normalizeNote } from '../../limits/core/normalizeNote'
import { blocksToTiptap } from '../note/blocksToTiptap'
import { tiptapToBlocks } from '../note/tiptapToBlocks'
import { validateNote } from '../note/validateNote'
import type { TextEditorProps } from '../document'

export function createUpdateHandler(onChange: TextEditorProps['onChange']) {
  return ({ editor }: { editor: Pick<Editor, 'getJSON'> }) => onChange?.(tiptapToBlocks(editor.getJSON()))
}

export function createEditorOptions({
  initialContent,
  onChange,
  maxBlockCharacters,
  maxNoteCharacters,
  maxBlocks,
}: TextEditorProps) {
  const blocks = initialContent === undefined ? [] : initialContent
  validateNote(blocks)
  return {
    content: blocksToTiptap(normalizeNote(blocks, { maxBlockCharacters, maxNoteCharacters, maxBlocks })),
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

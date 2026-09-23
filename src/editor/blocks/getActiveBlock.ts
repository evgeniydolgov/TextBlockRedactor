import type { Editor } from '@tiptap/core'
import { editorBlocks } from './index'

export function getActiveBlock(editor: Editor | null | undefined) {
  if (!editor) return 'paragraph'
  return editorBlocks.find((block) => block.isActive(editor))?.id ?? 'paragraph'
}

import type { BlockDefinition } from './types'

export const paragraphBlock: BlockDefinition = {
  id: 'paragraph',
  label: 'Текст',
  ariaLabel: 'Текст',
  apply: (editor) => editor.chain().focus().setParagraph().run(),
  isActive: (editor) => editor.isActive('paragraph'),
}

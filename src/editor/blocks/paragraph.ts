import type { BlockDefinition } from './types'
import { canFormatText } from './attachments/attachmentCommands'

export const paragraphBlock: BlockDefinition = {
  id: 'paragraph',
  label: 'Текст',
  ariaLabel: 'Текст',
  apply: (editor) => canFormatText(editor) && editor.chain().focus().setParagraph().run(),
  isActive: (editor) => editor.isActive('paragraph'),
}

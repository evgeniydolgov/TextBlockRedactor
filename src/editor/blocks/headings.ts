import type { BlockDefinition } from './types'
import { canFormatText } from './attachmentCommands'

export const headingLevels = [1, 2, 3] as const

export const headingBlocks: BlockDefinition[] = headingLevels.map((level) => ({
  id: `h${level}`,
  label: `H${level}`,
  ariaLabel: `Заголовок ${level}`,
  apply: (editor) => canFormatText(editor) && editor.chain().focus().setHeading({ level }).run(),
  isActive: (editor) => editor.isActive('heading', { level }),
}))

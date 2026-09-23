import type { BlockDefinition } from './types'

export const headingLevels = [1, 2, 3] as const

export const headingBlocks: BlockDefinition[] = headingLevels.map((level) => ({
  id: `h${level}`,
  label: `H${level}`,
  ariaLabel: `Заголовок ${level}`,
  apply: (editor) => editor.chain().focus().setHeading({ level }).run(),
  isActive: (editor) => editor.isActive('heading', { level }),
}))

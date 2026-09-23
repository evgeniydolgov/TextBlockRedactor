import type { Editor } from '@tiptap/core'

export type BlockDefinition = {
  id: string
  label: string
  ariaLabel: string
  apply: (editor: Editor) => boolean
  isActive: (editor: Editor) => boolean
}

import { Extension } from '@tiptap/core'
import { deleteSelectedAttachment } from './attachmentCommands'

// Keep paragraph first in the schema while handling Backspace before base keymaps.
export const AttachmentKeyboard = Extension.create({
  name: 'attachmentKeyboard',
  priority: 1100,
  addKeyboardShortcuts() {
    return { Backspace: () => deleteSelectedAttachment(this.editor) }
  },
})

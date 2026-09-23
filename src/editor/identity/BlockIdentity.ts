import { commands, Extension } from '@tiptap/core'
import { preserveBlockIds } from './preserveBlockIds'
import { splitWithBlockIds } from './splitWithBlockIds'

export const BlockIdentity = Extension.create({
  name: 'blockIdentity',
  // Core command extensions have priority 100; our wrappers override their commands.
  priority: 90,
  addCommands() {
    return {
      setNode: (type, attrs) => preserveBlockIds(commands.setNode(type, attrs)),
      clearNodes: () => preserveBlockIds(commands.clearNodes()),
      splitBlock: (options) => splitWithBlockIds(commands.splitBlock(options)),
    }
  },
})

import Heading from '@tiptap/extension-heading'
import { textblockTypeInputRule } from '@tiptap/core'

export const NoteHeading = Heading.extend({
  addInputRules() {
    return this.options.levels.map((level) => textblockTypeInputRule({
      find: new RegExp(`^(#{${Math.min(...this.options.levels)},${level}})\\s$`),
      type: this.type,
      getAttributes: () => ({
        level,
        id: this.editor.state.selection.$from.parent.attrs.id,
      }),
    }))
  },
})

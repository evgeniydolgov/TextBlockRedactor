import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { insertLimitedPaste, insertLimitedText } from './inputHandlers'
import type { LimitController } from './limitController'

export const ContentLimitsExtension = Extension.create<{ controller: LimitController }>({
  name: 'contentLimits',
  // UniqueID (10000) assigns missing IDs first; heading input rules (100) still work.
  priority: 50,
  addProseMirrorPlugins() {
    const { controller } = this.options
    return [new Plugin({
      filterTransaction: tr => controller.allows(tr),
      appendTransaction: (transactions, _oldState, state) => controller.append(transactions, state),
      props: {
        handleTextInput: (view, from, to, text) => insertLimitedText(view, from, to, text, controller.get()),
        handlePaste: (view, _event, slice) => insertLimitedPaste(view, slice, controller.get()),
      },
    })]
  },
})

import type { EditorState, Transaction } from '@tiptap/pm/state'
import { resolveLimits, type ContentLimits } from '../core/limits'
import { fitsTransaction, normalizeTransaction, readTextBlocks } from './transactionContent'

export function createLimitController(options: Partial<ContentLimits>) {
  let limits = resolveLimits(options)
  return {
    get: () => limits,
    allows: (tr: Pick<Transaction, 'docChanged' | 'doc'>) => fitsTransaction(tr, limits),
    append(transactions: readonly Pick<Transaction, 'docChanged'>[], state: Pick<EditorState, 'tr'>) {
      if (!transactions.some(tr => tr.docChanged)) return undefined
      const tr = normalizeTransaction(state.tr, limits)
      return tr.docChanged ? tr : undefined
    },
    configure(next: Partial<ContentLimits>, state: Pick<EditorState, 'tr'>) {
      const resolved = resolveLimits(next)
      if (Object.keys(limits).every(key => limits[key as keyof ContentLimits] === resolved[key as keyof ContentLimits])) {
        return undefined
      }
      limits = resolved
      const tr = state.tr
      const texts = readTextBlocks(tr.doc).map(block => block.text)
      if (texts.length <= limits.maxBlocks && texts.every(text => text.length <= limits.maxBlockCharacters)
        && texts.reduce((sum, text) => sum + text.length, 0) <= limits.maxNoteCharacters) return undefined
      normalizeTransaction(tr, limits, true)
      // Mapping old history through trimming prevents undo from recovering removed text.
      return tr.setMeta('addToHistory', false)
    },
  }
}

export type LimitController = ReturnType<typeof createLimitController>

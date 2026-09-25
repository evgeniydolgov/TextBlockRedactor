import { describe, expect, it, vi } from 'vitest'
import { limitTransactionStub, textDoc } from '../testing/limitTransactionStub'
import { resolveLimits } from './limits'
import { fitsTransaction, normalizeTransaction } from './transactionContent'

describe('transaction content adapter', () => {
  it('counts leaf attachments and preserves them at a full text budget during trimming', () => {
    const { tr, transaction } = limitTransactionStub([])
    tr.doc = textDoc(['abc', '', ''], ['p', 'image', 'file'], ['paragraph', 'image', 'file'])
    const limits = resolveLimits({ maxNoteCharacters: 3, maxBlocks: 3 })
    expect(fitsTransaction({ docChanged: true, doc: tr.doc }, limits)).toBe(true)
    normalizeTransaction(transaction, limits, true)
    expect(tr.delete).not.toHaveBeenCalled()
    expect(tr.split).not.toHaveBeenCalled()
    expect(fitsTransaction({ docChanged: true, doc: tr.doc }, { ...limits, maxBlocks: 2 })).toBe(false)
    normalizeTransaction(transaction, { ...limits, maxBlocks: 2 }, true)
    expect(tr.delete).toHaveBeenCalledExactlyOnceWith(6, 7)
  })
  it('passes selection-only changes and rejects over-budget documents before normalization', () => {
    const limits = resolveLimits({ maxBlockCharacters: 3, maxNoteCharacters: 6, maxBlocks: 2 })
    const changed = (texts: string[]) => ({ docChanged: true, doc: textDoc(texts) })
    expect(fitsTransaction(changed(['abcdef']), limits)).toBe(true) // merge: split before output
    expect(fitsTransaction(changed(['abcdefg']), limits)).toBe(false) // IME / history
    expect(fitsTransaction(changed(['ab', 'cd', '']), limits)).toBe(false) // Enter
    expect(fitsTransaction(changed(['a', '']), limits)).toBe(true) // deletion / split
    expect(fitsTransaction({ ...changed(['too long']), docChanged: false }, limits)).toBe(true)
  })

  it('splits backwards at local text offsets and only assigns continuation IDs', () => {
    const { tr, transaction } = limitTransactionStub(['abcdefg', 'xy'], ['first', 'next'])
    const ids = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('right').mockReturnValueOnce('middle')
    normalizeTransaction(transaction, resolveLimits({ maxBlockCharacters: 3 }), false, ids)
    expect(tr.delete).not.toHaveBeenCalled()
    expect(tr.split.mock.calls).toEqual([
      [7, 1, [{ type: { name: 'paragraph' }, attrs: { id: 'right' } }]],
      [4, 1, [{ type: { name: 'paragraph' }, attrs: { id: 'middle' } }]],
    ])
    expect(ids).toHaveBeenCalledTimes(3)
    // No replacement of the whole document or explicit jump of the cursor.
    // Selection is mapped by the local split/delete steps in the real transaction.
  })

  it('deletes discarded blocks and text before splitting the retained prefix', () => {
    const { tr, transaction } = limitTransactionStub(['abcdefg', 'tail', ''])
    normalizeTransaction(transaction, resolveLimits({ maxBlockCharacters: 3, maxNoteCharacters: 5 }), true, () => 'new')
    expect(tr.delete.mock.calls).toEqual([[15, 17], [9, 15], [6, 8]])
    expect(tr.split).toHaveBeenCalledExactlyOnceWith(4, 1, [{ type: { name: 'paragraph' }, attrs: { id: 'new' } }])
  })

  it('leaves valid blocks untouched and splits outside surrogate pairs', () => {
    const valid = limitTransactionStub(['abc', ''])
    const ids = vi.fn(() => 'new')
    normalizeTransaction(valid.transaction, resolveLimits({ maxBlockCharacters: 3 }), false, ids)
    expect(valid.tr.docChanged).toBe(false)
    expect(ids).not.toHaveBeenCalled()
    const emoji = limitTransactionStub(['ab😀c'])
    normalizeTransaction(emoji.transaction, resolveLimits({ maxBlockCharacters: 3 }), false, ids)
    expect(emoji.tr.split.mock.calls[0][0]).toBe(3)
  })
})

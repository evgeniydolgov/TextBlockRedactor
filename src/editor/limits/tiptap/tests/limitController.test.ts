import { describe, expect, it } from 'vitest'
import { limitTransactionStub, textDoc } from '../../../testing/limitTransactionStub'
import { createLimitController } from '../limitController'

describe('instance limit controller', () => {
  it('trims mixed blocks and rejects history above the new block limit', () => {
    const controller = createLimitController({ maxBlocks: 3 })
    const stub = limitTransactionStub([])
    stub.tr.doc = textDoc(['abc', '', ''], ['p', 'i', 'f'], ['paragraph', 'image', 'file'])
    controller.configure({ maxNoteCharacters: 3, maxBlocks: 2 }, stub.state)
    expect(stub.tr.delete).toHaveBeenCalledExactlyOnceWith(6, 7)
    expect(stub.tr.split).not.toHaveBeenCalled()
    expect(controller.allows({ docChanged: true, doc: stub.tr.doc })).toBe(false)
  })
  it('normalizes only changed transactions and stops after the document fits', () => {
    const controller = createLimitController({ maxBlockCharacters: 3 })
    const overflowing = limitTransactionStub(['abcd'])
    expect(controller.append([{ docChanged: false }], overflowing.state)).toBeUndefined()
    expect(controller.append([{ docChanged: true }], overflowing.state)).toBe(overflowing.tr)
    expect(overflowing.tr.split).toHaveBeenCalledOnce()
    const normalized = limitTransactionStub(['abc', 'd'])
    expect(controller.append([{ docChanged: true }], normalized.state)).toBeUndefined()
  })

  it('lowers limits, maps trimming outside history, and rejects old oversized undo/redo', () => {
    const controller = createLimitController({ maxNoteCharacters: 10 })
    const existing = limitTransactionStub(['abcdef'])
    expect(controller.configure({ maxNoteCharacters: 3 }, existing.state)).toBe(existing.tr)
    expect(existing.tr.delete).toHaveBeenCalledExactlyOnceWith(4, 7)
    expect(existing.tr.setMeta).toHaveBeenCalledExactlyOnceWith('addToHistory', false)
    expect(controller.allows({ docChanged: true, doc: textDoc(['abcdef']) })).toBe(false)
    expect(controller.allows({ docChanged: true, doc: textDoc(['ab']) })).toBe(true)
  })

  it('ignores equal settings, increases without writes and isolates instances', () => {
    const first = createLimitController({ maxNoteCharacters: 3 })
    const second = createLimitController({ maxNoteCharacters: 2 })
    const state = limitTransactionStub(['abc', ''])
    expect(first.configure({ maxNoteCharacters: 3 }, state.state)).toBeUndefined()
    expect(first.configure({ maxNoteCharacters: 4 }, state.state)).toBeUndefined()
    expect(state.tr.delete).not.toHaveBeenCalled()
    expect(first.get().maxNoteCharacters).toBe(4)
    expect(second.get().maxNoteCharacters).toBe(2)
    expect(first.append([{ docChanged: false }], state.state)).toBeUndefined()
  })

  it('applies all lowered settings even if only block length requires splitting', () => {
    const controller = createLimitController({})
    const state = limitTransactionStub(['abcd', 'ef'])
    controller.configure({ maxBlockCharacters: 2, maxBlocks: 2 }, state.state)
    expect(state.tr.delete).toHaveBeenCalledExactlyOnceWith(6, 10)
    expect(state.tr.split.mock.calls[0][0]).toBe(3)
    expect(controller.allows({ docChanged: true, doc: textDoc(['ab', 'cd', '']) })).toBe(false)
  })
})

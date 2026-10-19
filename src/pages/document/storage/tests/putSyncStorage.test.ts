import { describe, expect, it, vi } from 'vitest'
import { paragraph } from '../../../../editor/testing/noteFixtures'
import { createPutSyncStorage, PUT_SYNC_STORAGE_KEY } from '../putSyncStorage'

function memoryStorage(initial: string | null = null) {
  let raw = initial
  return {
    getItem: vi.fn(() => raw),
    setItem: vi.fn((_key: string, value: string) => { raw = value }),
    readRaw: () => raw,
  }
}

describe('putSyncStorage', () => {
  it('round trips a confirmed snapshot for its note without changing the draft', () => {
    const memory = memoryStorage()
    const storage = createPutSyncStorage(() => memory)
    const confirmed = [paragraph('block-1', 'Подтверждено')]
    const before = structuredClone(confirmed)

    expect(storage.save('note-1', confirmed, [])).toEqual({ error: null })
    expect(memory.setItem).toHaveBeenCalledOnce()
    expect(memory.setItem.mock.calls[0][0]).toBe(PUT_SYNC_STORAGE_KEY)
    expect(storage.load('note-1')).toEqual({ confirmed, blockedIds: [], error: null })
    expect(confirmed).toEqual(before)
    expect(memory.readRaw()).toContain('note-1')
  })

  it('restores an unresolved PUT marker alongside the older confirmed block after reload', () => {
    const memory = memoryStorage()
    const confirmed = [paragraph('block-1', 'A')]
    const storage = createPutSyncStorage(() => memory)

    expect(storage.save('note-1', confirmed, ['block-1'])).toEqual({ error: null })
    expect(createPutSyncStorage(() => memory).load('note-1')).toEqual({
      confirmed, blockedIds: ['block-1'], error: null,
    })
  })

  it('does not treat an absent or another note’s record as a confirmed baseline', () => {
    const memory = memoryStorage()
    const storage = createPutSyncStorage(() => memory)
    expect(storage.load('note-1')).toEqual({ confirmed: null, blockedIds: [], error: null })
    storage.save('note-1', [paragraph('block-1')], ['block-1'])
    expect(storage.load('note-2')).toEqual({ confirmed: null, blockedIds: [], error: null })
  })

  it.each(['{', '{}', 'null', '[]'])('rejects malformed confirmed data %s', raw => {
    const memory = memoryStorage(raw)
    const result = createPutSyncStorage(() => memory).load('note-1')
    expect(result.confirmed).toBeNull()
    expect(result.blockedIds).toEqual([])
    expect(memory.setItem).not.toHaveBeenCalled()
  })

  it('rejects a malformed marker instead of trusting the baseline', () => {
    const memory = memoryStorage(JSON.stringify({
      version: 1, noteId: 'note-1', confirmed: [paragraph('block-1')], blockedIds: ['missing'],
    }))

    expect(createPutSyncStorage(() => memory).load('note-1')).toEqual({
      confirmed: null, blockedIds: [], error: expect.any(String),
    })
  })

  it('reports a failed write and does not claim the new baseline survived reload', () => {
    const memory = memoryStorage()
    const storage = createPutSyncStorage(() => memory)
    const original = [paragraph('block-1', 'A')]
    const newer = [paragraph('block-1', 'B')]
    expect(storage.save('note-1', original, ['block-1']).error).toBeNull()
    memory.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError') })

    expect(storage.save('note-1', newer, []).error).not.toBeNull()
    expect(createPutSyncStorage(() => memory).load('note-1')).toEqual({
      confirmed: original, blockedIds: ['block-1'], error: null,
    })
  })
})

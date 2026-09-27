import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNoteSaveHandler } from '../createNoteSaveHandler'
import { paragraph } from '../../../editor/testing/noteFixtures'
import { SAVE_ERROR } from '../storage/noteStorage'

beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => {}))
afterEach(() => vi.restoreAllMocks())

describe('createNoteSaveHandler', () => {
  it('saves, reports success and logs one immutable JSON snapshot', () => {
    const save = vi.fn(() => ({ error: null }))
    const reportError = vi.fn()
    const note = [paragraph('123', 'Текст')]
    createNoteSaveHandler(save, reportError)(note)
    expect(save).toHaveBeenCalledExactlyOnceWith(note)
    expect(reportError).toHaveBeenCalledExactlyOnceWith(null)
    expect(console.log).toHaveBeenCalledExactlyOnceWith('[note:blocks]', JSON.stringify(note, null, 2))
  })

  it('reports write errors without losing data and clears the error on success', () => {
    const save = vi.fn<Parameters<typeof createNoteSaveHandler>[0]>()
      .mockReturnValueOnce({ error: SAVE_ERROR }).mockReturnValue({ error: null })
    const reportError = vi.fn()
    const handler = createNoteSaveHandler(save, reportError)
    const note = [paragraph('123', 'Текст')]
    const before = structuredClone(note)
    handler(note)
    expect(reportError).toHaveBeenLastCalledWith(SAVE_ERROR)
    expect(note).toEqual(before)
    handler(note)
    expect(reportError).toHaveBeenLastCalledWith(null)
    expect(save).toHaveBeenCalledTimes(2)
    expect(console.log).toHaveBeenCalledTimes(2)
  })
})

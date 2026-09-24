import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedChange } from '../../editor/model/createDebouncedChange'
import { createRequestPreview } from '../../blocks/requests/createRequestPreview'
import { paragraph } from '../../editor/testing/noteFixtures'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage, NOTE_STORAGE_KEY, SAVE_ERROR } from './storage/noteStorage'
import { createRequestLogStorage, REQUEST_LOG_KEY } from './storage/requestLogStorage'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setup(failedKey?: string) {
  const values = new Map<string, string>([[REQUEST_LOG_KEY, 'old diagnostic data']])
  const memory = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (key === failedKey) throw new Error('Storage failed')
      values.set(key, value)
    }),
  }
  const storage = createNoteStorage(() => memory)
  storage.load()
  const initial = [paragraph('123')]
  const reportError = vi.fn()
  const handler = createNoteSaveHandler(storage.save, reportError, {
    preview: createRequestPreview(initial), recordCycle: createRequestLogStorage(() => memory),
  })
  const changes = createDebouncedChange(handler)
  const cycle = () => JSON.parse(values.get(REQUEST_LOG_KEY)!)
  return { values, memory, initial, changes, cycle, reportError }
}

describe('request preview autosave', () => {
  it('records only the last cycle after the pause and keeps both console outputs', () => {
    const { changes, memory, cycle } = setup()
    expect(memory.getItem).toHaveBeenCalledExactlyOnceWith(NOTE_STORAGE_KEY)
    expect(memory.setItem).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalled()
    changes.schedule([paragraph('123', 'П')])
    vi.advanceTimersByTime(500)
    const current = [paragraph('123', 'Привет 🌍')]
    changes.schedule(current)
    vi.advanceTimersByTime(999)
    expect(memory.setItem).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    const requests = [{ method: 'PUT', path: '/blocks/123', body: current[0] }]
    expect(cycle()).toEqual({ requests, storage: {
      key: NOTE_STORAGE_KEY, data: current, success: true, error: null,
    } })
    expect(memory.setItem.mock.calls.map(([key]) => key)).toEqual([NOTE_STORAGE_KEY, REQUEST_LOG_KEY])
    expect(console.log).toHaveBeenCalledWith('[note:blocks]', JSON.stringify(current, null, 2))
    expect(console.log).toHaveBeenCalledWith('[note:requests]', requests)
    changes.schedule(current)
    changes.flush()
    expect(cycle().requests).toEqual([])
    expect(console.log).toHaveBeenCalledTimes(3)
    changes.flush()
    vi.runAllTimers()
    expect(memory.setItem).toHaveBeenCalledTimes(4)
  })

  it('records reverted edits with no requests and flushes new changes immediately', () => {
    const { changes, initial, cycle } = setup()
    changes.schedule([paragraph('123', 'Temporary')])
    changes.schedule(initial)
    changes.flush()
    expect(cycle().requests).toEqual([])
    expect(console.log).toHaveBeenCalledOnce()
    const current = [paragraph('123', 'New')]
    changes.schedule(current)
    changes.flush()
    expect(cycle().storage.data).toEqual(current)
    expect(cycle().requests).toHaveLength(1)
  })

  it('records primary write failure and advances preview without repeating requests', () => {
    const { changes, cycle, reportError } = setup(NOTE_STORAGE_KEY)
    const current = [paragraph('123', 'Not saved')]
    changes.schedule(current)
    changes.flush()
    expect(cycle().storage).toEqual({ key: NOTE_STORAGE_KEY, data: current, success: false, error: SAVE_ERROR })
    expect(cycle().requests).toHaveLength(1)
    expect(reportError).toHaveBeenCalledWith(SAVE_ERROR)
    changes.schedule(current)
    changes.flush()
    expect(cycle().requests).toEqual([])
  })

  it('isolates diagnostic errors from primary saving, preview and further editing', () => {
    const { changes, values, reportError, memory } = setup(REQUEST_LOG_KEY)
    const current = [paragraph('123', 'Saved')]
    changes.schedule(current)
    expect(() => changes.flush()).not.toThrow()
    expect(JSON.parse(values.get(NOTE_STORAGE_KEY)!)).toEqual(current)
    expect(values.get(REQUEST_LOG_KEY)).toBe('old diagnostic data')
    expect(reportError).toHaveBeenCalledWith(null)
    expect(console.warn).toHaveBeenCalledOnce()
    changes.schedule(current)
    changes.flush()
    expect(console.log).toHaveBeenCalledTimes(3)
    vi.runAllTimers()
    expect(memory.setItem).toHaveBeenCalledTimes(4)
  })
})

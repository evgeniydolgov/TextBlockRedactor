import { afterEach, expect, it, vi } from 'vitest'
import { createRequestLogStorage, REQUEST_LOG_KEY } from '../requestLogStorage'
import { NOTE_STORAGE_KEY } from '../noteStorage'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('accesses storage lazily and writes one JSON object using the browser getter', () => {
  const setItem = vi.fn()
  vi.stubGlobal('window', { localStorage: { setItem } })
  const record = createRequestLogStorage()
  expect(setItem).not.toHaveBeenCalled()
  const cycle = { requests: [], storage: { key: NOTE_STORAGE_KEY, data: [], success: true, error: null } }
  record(cycle)
  expect(setItem).toHaveBeenCalledExactlyOnceWith(REQUEST_LOG_KEY, JSON.stringify(cycle))
})

it('catches access errors without retrying', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = new Error('SecurityError')
  const access = vi.fn(() => { throw error })
  vi.stubGlobal('window', Object.defineProperty({}, 'localStorage', { get: access }))
  expect(() => createRequestLogStorage()({ requests: [], storage: {
    key: NOTE_STORAGE_KEY, data: [], success: false, error: 'Failed',
  } })).not.toThrow()
  expect(access).toHaveBeenCalledOnce()
  expect(warn).toHaveBeenCalledExactlyOnceWith('[note:request-log] Не удалось записать последний цикл', error)
})

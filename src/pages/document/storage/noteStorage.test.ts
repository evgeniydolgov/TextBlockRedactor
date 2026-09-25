import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNoteStorage, LOAD_ERROR, NOTE_STORAGE_KEY, SAVE_ERROR } from './noteStorage'
import { attachmentNote, mixedNote, paragraph, populatedImage } from '../../../editor/testing/noteFixtures'

afterEach(() => vi.unstubAllGlobals())

function memoryStorage(raw: string | null = null) {
  let value = raw
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => { value = next }),
  }
}

describe('noteStorage', () => {
  it('reloads mixed attachments with omitted undefined fields', () => {
    const memory = memoryStorage()
    const storage = createNoteStorage(() => memory)
    const note = [...attachmentNote(), populatedImage('populated')]
    expect(storage.save(note).error).toBeNull()
    expect(storage.load()).toEqual({ document: JSON.parse(JSON.stringify(note)), error: null })
    expect(memory.getItem()).not.toContain('previewWidth')
  })
  it('round trips blocks, Unicode, empty blocks and existing ID formats', () => {
    const memory = memoryStorage()
    const storage = createNoteStorage(() => memory)
    const note = [...mixedNote(), paragraph('123'),
      paragraph('550e8400-e29b-41d4-a716-446655440000'),
      paragraph('0197cc01-8ee0-7000-8000-000000000001')]
    expect(storage.save(note)).toEqual({ error: null })
    expect(memory.setItem).toHaveBeenCalledExactlyOnceWith(NOTE_STORAGE_KEY, JSON.stringify(note))
    expect(storage.load()).toEqual({ document: note, error: null })
    expect(memory.getItem).toHaveBeenCalledExactlyOnceWith(NOTE_STORAGE_KEY)
  })

  it.each([null, '[]'])('loads empty or missing value %s without writing', raw => {
    const memory = memoryStorage(raw)
    expect(createNoteStorage(() => memory).load()).toEqual({ document: [], error: null })
    expect(memory.setItem).not.toHaveBeenCalled()
  })

  it.each(['', '{', 'null', '{}', '[{"type":"image"}]',
    JSON.stringify([paragraph('same'), paragraph('same')])])('preserves invalid stored data %s', raw => {
    const memory = memoryStorage(raw)
    const storage = createNoteStorage(() => memory)
    expect(storage.load()).toEqual({ document: [], error: LOAD_ERROR })
    expect(memory.getItem()).toBe(raw)
    expect(memory.setItem).not.toHaveBeenCalled()
    const replacement = [paragraph('new', 'Новый текст')]
    expect(storage.save(replacement)).toEqual({ error: null })
    expect(storage.load().document).toEqual(replacement)
  })

  it('handles inaccessible localStorage property for reads and writes', () => {
    vi.stubGlobal('window', Object.defineProperty({}, 'localStorage', {
      get() { throw new Error('SecurityError') },
    }))
    const storage = createNoteStorage()
    expect(storage.load()).toEqual({ document: [], error: LOAD_ERROR })
    expect(storage.save([])).toEqual({ error: SAVE_ERROR })
  })

  it('uses the browser storage getter lazily', () => {
    const memory = memoryStorage()
    vi.stubGlobal('window', { localStorage: memory })
    const storage = createNoteStorage()
    expect(memory.getItem).not.toHaveBeenCalled()
    storage.save([])
    expect(storage.load()).toEqual({ document: [], error: null })
  })

  it('handles getItem errors and retries a failed write on a later call', () => {
    const memory = memoryStorage()
    const storage = createNoteStorage(() => memory)
    memory.getItem.mockImplementationOnce(() => { throw new Error('Read failed') })
    expect(storage.load().error).toBe(LOAD_ERROR)
    memory.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError') })
    const note = [paragraph('123', 'Текст')]
    const before = structuredClone(note)
    expect(storage.save(note).error).toBe(SAVE_ERROR)
    expect(note).toEqual(before)
    expect(storage.save(note).error).toBeNull()
    expect(storage.load().document).toEqual(note)
  })
})

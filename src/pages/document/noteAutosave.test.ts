import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedChange } from '../../editor/model/createDebouncedChange'
import { bindSaveLifecycle } from '../../editor/model/bindSaveLifecycle'
import { attachmentNote, paragraph } from '../../editor/testing/noteFixtures'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage, NOTE_STORAGE_KEY } from './storage/noteStorage'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setup() {
  const values = new Map<string, string>()
  const memory = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
  }
  const storage = createNoteStorage(() => memory)
  const changes = createDebouncedChange(createNoteSaveHandler(storage.save, vi.fn()))
  return { memory, storage, changes }
}

describe('note autosave composition', () => {
  it('debounces attachment insertion and flushes removal without changing IDs or shapes', () => {
    const { memory, storage, changes } = setup()
    const note = attachmentNote()
    changes.schedule(note)
    expect(memory.setItem).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(storage.load().document).toEqual(JSON.parse(JSON.stringify(note)))
    changes.schedule(note.slice(0, -1))
    changes.flush()
    expect(storage.load().document).toEqual(JSON.parse(JSON.stringify(note.slice(0, -1))))
    expect(memory.setItem).toHaveBeenCalledTimes(2)
  })
  it('does not write on load or during typing and saves only the latest snapshot after the pause', () => {
    const { memory, storage, changes } = setup()
    expect(storage.load().document).toEqual([])
    expect(memory.setItem).not.toHaveBeenCalled()
    changes.schedule([paragraph('123', 'Один')])
    vi.advanceTimersByTime(900)
    const latest = [paragraph('123', 'Один два')]
    changes.schedule(latest)
    vi.advanceTimersByTime(999)
    expect(memory.setItem).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(memory.setItem).toHaveBeenCalledExactlyOnceWith(NOTE_STORAGE_KEY, JSON.stringify(latest))
    expect(console.log).toHaveBeenCalledExactlyOnceWith('[note:blocks]', JSON.stringify(latest, null, 2))
    expect(storage.load().document).toEqual(latest)
  })

  it('persists immediately on departure and ignores the old timer and repeated signals', () => {
    const { memory, storage, changes } = setup()
    const page = new EventTarget()
    const visibility = Object.assign(new EventTarget(), { visibilityState: 'hidden' })
    const cleanup = bindSaveLifecycle(changes.flush, page, visibility)
    const latest = [paragraph('123', 'До перезагрузки')]
    changes.schedule(latest)
    vi.advanceTimersByTime(100)
    visibility.dispatchEvent(new Event('visibilitychange'))
    expect(storage.load().document).toEqual(latest)
    page.dispatchEvent(new Event('pagehide'))
    cleanup()
    vi.runAllTimers()
    expect(memory.setItem).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledOnce()
  })

  it('overwrites the previous saved text when the note is cleared', () => {
    const { storage, changes } = setup()
    storage.save([paragraph('123', 'Старый текст')])
    changes.schedule([paragraph('123')])
    vi.advanceTimersByTime(1000)
    expect(storage.load().document).toEqual([paragraph('123')])
  })
})

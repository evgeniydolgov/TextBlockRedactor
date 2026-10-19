import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPutQueue } from '../../../blocks/sync/putQueue'
import { createRequestPreview } from '../../../blocks/requests/createRequestPreview'
import { createDebouncedChange } from '../../../editor/model/lifecycle/createDebouncedChange'
import { paragraph } from '../../../editor/testing/noteFixtures'
import { createNoteSaveHandler } from '../createNoteSaveHandler'
import { createPutSyncAutosave } from '../createPutSyncAutosave'
import { getPutSyncStatusText } from '../putSyncStatus'
import { createNoteStorage, NOTE_STORAGE_KEY } from '../storage/noteStorage'
import { createPutSyncStorage, PUT_SYNC_STORAGE_KEY } from '../storage/putSyncStorage'
import { createRequestLogStorage, REQUEST_LOG_KEY } from '../storage/requestLogStorage'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

function memoryStorage(failedKey?: string) {
  const values = new Map<string, string>()
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (key === failedKey) throw new Error('Storage failed')
      values.set(key, value)
    }),
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PUT autosave composition', () => {
  it('saves the latest draft before the unresolved marker and PUT, keeping preview independent', async () => {
    const memory = memoryStorage()
    const noteStorage = createNoteStorage(() => memory)
    const syncStorage = createPutSyncStorage(() => memory)
    const baseline = [paragraph('2', 'original')]
    const pending = deferred()
    const putBlock = vi.fn(() => {
      expect(noteStorage.load().document).toEqual([paragraph('2', 'C')])
      expect(syncStorage.load('note-1').blockedIds).toEqual(['2'])
      return pending.promise
    })
    syncStorage.save('note-1', baseline, [])
    memory.setItem.mockClear()
    const queue = createPutQueue({
      confirmed: baseline, putBlock,
      persistState: (confirmed, blockedIds) =>
        syncStorage.save('note-1', confirmed, blockedIds).error === null,
    })
    const saveNote = createNoteSaveHandler(noteStorage.save, vi.fn(), {
      preview: createRequestPreview(baseline, 'note-1'),
      recordCycle: createRequestLogStorage(() => memory),
    })
    const changes = createDebouncedChange(createPutSyncAutosave(saveNote, () => queue))

    changes.schedule([paragraph('2', 'B')])
    vi.advanceTimersByTime(500)
    changes.schedule([paragraph('2', 'C')])
    vi.advanceTimersByTime(1000)

    expect(memory.setItem.mock.calls.map(([key]) => key)).toEqual([
      NOTE_STORAGE_KEY, REQUEST_LOG_KEY, PUT_SYNC_STORAGE_KEY,
    ])
    expect(putBlock).toHaveBeenCalledExactlyOnceWith(paragraph('2', 'C'))
    expect(JSON.parse(memory.values.get(REQUEST_LOG_KEY)!).requests).toEqual([
      { method: 'PUT', path: '/blocks/2', body: paragraph('2', 'C') },
    ])
    pending.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(noteStorage.load().document).toEqual([paragraph('2', 'C')])
    expect(syncStorage.load('note-1').blockedIds).toEqual([])
    queue.destroy()
  })

  it('does not start PUT when saving the draft fails', () => {
    const memory = memoryStorage(NOTE_STORAGE_KEY)
    const baseline = [paragraph('2', 'original')]
    const putBlock = vi.fn(() => Promise.resolve())
    const queue = createPutQueue({ confirmed: baseline, putBlock })
    const reportError = vi.fn()
    const saveNote = createNoteSaveHandler(createNoteStorage(() => memory).save, reportError)
    const changes = createDebouncedChange(createPutSyncAutosave(saveNote, () => queue))

    changes.schedule([paragraph('2', 'A')])
    vi.advanceTimersByTime(1000)

    expect(putBlock).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalledWith(expect.any(String))
    queue.destroy()
  })

  it('recovers the latest draft and blocks an unresolved ID after reload', () => {
    const memory = memoryStorage()
    const noteStorage = createNoteStorage(() => memory)
    const syncStorage = createPutSyncStorage(() => memory)
    const baseline = [paragraph('2', 'original')]
    syncStorage.save('note-1', baseline, ['2'])
    noteStorage.save([paragraph('2', 'C')])

    const recovered = syncStorage.load('note-1')
    const putBlock = vi.fn(() => Promise.resolve())
    const queue = createPutQueue({
      confirmed: recovered.confirmed!, blockedIds: recovered.blockedIds, putBlock,
    })
    const draft = noteStorage.load().document
    queue.update(draft)

    expect(draft).toEqual([paragraph('2', 'C')])
    expect(putBlock).not.toHaveBeenCalled()
    expect(queue.getStatus().errorIds).toEqual(['2'])
    queue.destroy()
  })

  it('keeps the local draft and unresolved marker when the response cannot be recorded', async () => {
    const memory = memoryStorage()
    const noteStorage = createNoteStorage(() => memory)
    const syncStorage = createPutSyncStorage(() => memory)
    const baseline = [paragraph('2', 'original')]
    const pending = deferred()
    syncStorage.save('note-1', baseline, [])
    memory.setItem.mockImplementation((key, value) => {
      if (key === PUT_SYNC_STORAGE_KEY && JSON.parse(value).blockedIds.length === 0) {
        throw new Error('Storage failed')
      }
      memory.values.set(key, value)
    })
    const queue = createPutQueue({
      confirmed: baseline, putBlock: () => pending.promise,
      persistState: (confirmed, blockedIds) =>
        syncStorage.save('note-1', confirmed, blockedIds).error === null,
    })
    const saveNote = createNoteSaveHandler(noteStorage.save, vi.fn())
    const changes = createDebouncedChange(createPutSyncAutosave(saveNote, () => queue))
    changes.schedule([paragraph('2', 'C')])
    vi.advanceTimersByTime(1000)
    pending.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(noteStorage.load().document).toEqual([paragraph('2', 'C')])
    expect(syncStorage.load('note-1')).toEqual({
      confirmed: baseline, blockedIds: ['2'], error: null,
    })
    expect(queue.getStatus().synchronized).toBe(false)
    queue.destroy()
  })
})

describe('PUT status text', () => {
  const ready = { active: 0, pending: 0, errorIds: [], structural: false, synchronized: true }
  const options = { initialized: true, demo: false }

  it('shows storage failure and missing trusted baseline before any sync claim', () => {
    expect(getPutSyncStatusText(ready, { ...options, storageError: 'Нет локального сохранения' }))
      .toBe('Нет локального сохранения')
    expect(getPutSyncStatusText(ready, { ...options, localError: 'Save failed' }))
      .toContain('локальный черновик не сохранён')
    expect(getPutSyncStatusText(null, { ...options, initialized: false }))
      .toBe('Синхронизация не инициализирована')
  })

  it('distinguishes active, failed and structural work from complete synchronization', () => {
    expect(getPutSyncStatusText({ ...ready, active: 1, synchronized: false }, options))
      .toBe('Синхронизируется')
    expect(getPutSyncStatusText({ ...ready, errorIds: ['2'], synchronized: false }, options))
      .toContain('Ошибка синхронизации')
    expect(getPutSyncStatusText({ ...ready, structural: true, synchronized: false }, options))
      .toContain('только локально')
    expect(getPutSyncStatusText(ready, options)).toBe('Синхронизировано с сервером')
    expect(getPutSyncStatusText(ready, { ...options, demo: true }))
      .toBe('Демо: изменения блоков подтверждены')
  })
})

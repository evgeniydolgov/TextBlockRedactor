import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Editor } from '@tiptap/core'
import { createRequestPreview } from '../../blocks/requests/createRequestPreview'
import { normalizeNote } from '../../editor/limits/normalizeNote'
import { createLimitController } from '../../editor/limits/limitController'
import { blockText } from '../../editor/limits/textBudget'
import { createUpdateHandler } from '../../editor/model/editorOptions'
import { blocksToTiptap } from '../../editor/model/blocksToTiptap'
import { createDebouncedChange } from '../../editor/model/createDebouncedChange'
import { bindSaveLifecycle } from '../../editor/model/bindSaveLifecycle'
import { paragraph } from '../../editor/testing/noteFixtures'
import { textDoc } from '../../editor/testing/limitTransactionStub'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage, NOTE_STORAGE_KEY } from './storage/noteStorage'
import { createRequestLogStorage, REQUEST_LOG_KEY } from './storage/requestLogStorage'
import { prepareInitialDocument } from './prepareInitialDocument'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function setup() {
  const loaded = [paragraph('a', 'abcdefghij')]
  const values = new Map([[NOTE_STORAGE_KEY, JSON.stringify(loaded)]])
  const memory = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
  }
  const storage = createNoteStorage(() => memory)
  const limits = { maxBlockCharacters: 3, maxNoteCharacters: 8, maxBlocks: 3 }
  const initial = prepareInitialDocument(storage.load().document, limits)
  const changes = createDebouncedChange(createNoteSaveHandler(storage.save, vi.fn(), {
    preview: createRequestPreview(initial), recordCycle: createRequestLogStorage(() => memory),
  }))
  const update = createUpdateHandler(changes.schedule)
  const emit = (document: typeof initial) => update({
    editor: { getJSON: () => blocksToTiptap(document) as ReturnType<Editor['getJSON']> },
  })
  const read = (key: string) => JSON.parse(values.get(key)!)
  return { initial, limits, memory, changes, emit, read }
}

describe('limited autosave pipeline (without editor runtime)', () => {
  it('does not write during mount, and saves only the final normalized snapshot once', () => {
    const { initial, limits, memory, changes, emit, read } = setup()
    expect(initial.map(blockText)).toEqual(['abc', 'def', 'gh'])
    changes.flush()
    expect(memory.setItem).not.toHaveBeenCalled()
    expect(read(NOTE_STORAGE_KEY)[0].content[0].text).toBe('abcdefghij')
    const final = normalizeNote([paragraph('a', 'ABCDEFG')], limits)
    emit(final)
    vi.advanceTimersByTime(999)
    expect(memory.setItem).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(read(NOTE_STORAGE_KEY)).toEqual(final)
    expect(read(REQUEST_LOG_KEY).storage.data).toEqual(final)
    expect(read(REQUEST_LOG_KEY).requests.some((request: { method: string }) => request.method === 'PUT')).toBe(true)
    expect(memory.setItem).toHaveBeenCalledTimes(2)
    changes.flush()
    expect(memory.setItem).toHaveBeenCalledTimes(2)
  })

  it('rejected editing leaves an existing timer and pending snapshot intact', () => {
    const { limits, emit, memory, read } = setup()
    const controller = createLimitController(limits)
    const final = normalizeNote([paragraph('a', 'ABCDEFG')], limits)
    emit(final)
    vi.advanceTimersByTime(900)
    const rejected = [paragraph('a', 'way too much text')]
    if (controller.allows({ docChanged: true, doc: textDoc(rejected.map(blockText)) })) emit(rejected)
    vi.advanceTimersByTime(100)
    expect(read(NOTE_STORAGE_KEY)).toEqual(final)
    expect(memory.setItem).toHaveBeenCalledTimes(2)
  })

  it('replaces pending with the lowered snapshot before immediate departure saving', () => {
    const { limits, emit, changes, memory, read } = setup()
    const old = normalizeNote([paragraph('a', 'ABCDEFG')], limits)
    emit(old)
    const trimmed = normalizeNote(old, { ...limits, maxNoteCharacters: 4 })
    emit(trimmed)
    const page = new EventTarget()
    const visibility = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    const cleanup = bindSaveLifecycle(changes.flush, page, visibility)
    page.dispatchEvent(new Event('pagehide'))
    expect(read(NOTE_STORAGE_KEY)).toEqual(trimmed)
    expect(read(REQUEST_LOG_KEY).storage.data).toEqual(trimmed)
    cleanup()
    vi.runAllTimers()
    expect(memory.setItem).toHaveBeenCalledTimes(2)
  })
})

import type { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEditorOptions, createUpdateHandler } from './editorOptions'
import { mixedNote, paragraph } from '../testing/noteFixtures'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'
import { createDebouncedChange } from './createDebouncedChange'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('createEditorOptions', () => {
  it.each([{}, { initialContent: [] }])('creates an empty block for %j', (props) => {
    const note = tiptapToBlocks(createEditorOptions(props).content)
    expect(note).toEqual([paragraph(expect.any(String))])
    expect(note[0].id).not.toBe(tiptapToBlocks(createEditorOptions(props).content)[0].id)
  })

  it('converts the supplied blocks without mutation', () => {
    const content = mixedNote()
    const before = structuredClone(content)
    expect(tiptapToBlocks(createEditorOptions({ initialContent: content }).content)).toEqual(content)
    expect(content).toEqual(before)
  })

  it('delivers delayed snapshots without logging and preserves snapshots and IDs', () => {
    vi.useFakeTimers()
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const first = [paragraph('a', 'До')]
    const second = [paragraph('a', 'После')]
    const getJSON = vi.fn<Editor['getJSON']>()
      .mockReturnValueOnce(blocksToTiptap(first) as ReturnType<Editor['getJSON']>)
      .mockReturnValueOnce(blocksToTiptap(second) as ReturnType<Editor['getJSON']>)
    const onChange = vi.fn()
    const changes = createDebouncedChange(onChange)
    const options = createEditorOptions({ onChange: changes.schedule })

    options.onUpdate({ editor: { getJSON } })
    expect(getJSON).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(first)
    expect(onChange.mock.calls[0][0]).toEqual(first)

    options.onUpdate({ editor: { getJSON } })
    expect(getJSON).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange.mock.calls[1][0]).toEqual(second)
    expect(onChange.mock.calls[0][0]).toEqual(first)
    expect(log).not.toHaveBeenCalled()
  })

  it('skips serialization when no callback is supplied', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const getJSON = vi.fn(() => { throw new Error('Serialization should be skipped') })
    const options = createEditorOptions({})
    expect(() => options.onUpdate({ editor: { getJSON } })).not.toThrow()
    expect(getJSON).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it('can update the callback without recreating initial content', () => {
    const first = vi.fn()
    const current = vi.fn()
    const editor = { getJSON: vi.fn<Editor['getJSON']>()
      .mockReturnValue(blocksToTiptap([paragraph('a')]) as ReturnType<Editor['getJSON']>) }
    const options = createEditorOptions({ onChange: first })
    const next = { ...options, onUpdate: createUpdateHandler(current) }
    next.onUpdate({ editor })
    expect(next.content).toBe(options.content)
    expect(current).toHaveBeenCalledExactlyOnceWith([paragraph('a')])
    expect(first).not.toHaveBeenCalled()
  })
})

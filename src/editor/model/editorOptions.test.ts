import type { Editor, JSONContent } from '@tiptap/core'
import { describe, expect, it, vi } from 'vitest'
import { emptyDocument } from './document'
import { createEditorOptions } from './editorOptions'

describe('createEditorOptions', () => {
  it('uses the empty document when initialContent is omitted', () => {
    expect(createEditorOptions({}).content).toBe(emptyDocument)
  })

  it('passes through the supplied document without mutation', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Черновик' }] }],
    }
    const before = structuredClone(content)
    expect(createEditorOptions({ initialContent: content }).content).toBe(content)
    expect(content).toEqual(before)
  })

  it('forwards the current JSON once for each update', () => {
    const first: ReturnType<Editor['getJSON']> = { type: 'doc', attrs: undefined, content: [] }
    const second: ReturnType<Editor['getJSON']> = {
      type: 'doc', attrs: undefined, content: [{ type: 'paragraph', attrs: undefined }],
    }
    const getJSON = vi.fn<Editor['getJSON']>().mockReturnValueOnce(first).mockReturnValueOnce(second)
    const onChange = vi.fn()
    const options = createEditorOptions({ onChange })

    options.onUpdate({ editor: { getJSON } })
    expect(getJSON).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(first)
    expect(onChange.mock.calls[0][0]).toBe(first)

    options.onUpdate({ editor: { getJSON } })
    expect(getJSON).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange.mock.calls[1][0]).toBe(second)
  })

  it('skips serialization when no callback is supplied', () => {
    const getJSON = vi.fn(() => { throw new Error('Serialization should be skipped') })
    const options = createEditorOptions({})
    expect(() => options.onUpdate({ editor: { getJSON } })).not.toThrow()
    expect(getJSON).not.toHaveBeenCalled()
  })
})

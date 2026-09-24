import type { Slice } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { describe, expect, it, vi } from 'vitest'
import { textDoc } from '../testing/limitTransactionStub'
import { resolveLimits } from './limits'
import { insertLimitedPaste, insertLimitedText } from './inputHandlers'

vi.mock('./pastePrefix', () => ({
  pasteEnds: () => [1, 2, 3, 4],
  pastePrefix: (_slice: unknown, end: number) => ({ end }),
}))

function viewStub(text = 'abcdef', paste: (end: number) => string[] = end => ['a' + 'WXYZ'.slice(0, end), 'bcdef']) {
  const doc = textDoc([text])
  function transaction() {
    const tr = {
      doc: { ...doc, eq: () => true },
      docChanged: false,
      insertText: vi.fn((incoming: string, from: number, to: number) => {
        update([text.slice(0, from) + incoming + text.slice(to)])
        return tr
      }),
      replaceSelection: vi.fn(({ end }: { end: number }) => { update(paste(end)); return tr }),
      setMeta: vi.fn((_key: string, _value: unknown) => tr),
      scrollIntoView: vi.fn(() => tr),
    }
    function update(texts: string[]) {
      tr.docChanged = true
      tr.doc = { ...textDoc(texts), eq: () => texts.length === 1 && texts[0] === text }
    }
    return tr
  }
  const dispatch = vi.fn()
  const state = { doc, get tr() { return transaction() } }
  return { view: { state, dispatch } as unknown as EditorView, dispatch }
}

describe('limited input adapters', () => {
  it('dispatches one local replacement for the fitting input prefix', () => {
    const { view, dispatch } = viewStub()
    expect(insertLimitedText(view, 3, 3, 'WXYZ', resolveLimits({ maxNoteCharacters: 8 }))).toBe(true)
    expect(dispatch).toHaveBeenCalledOnce()
    expect(dispatch.mock.calls[0][0].insertText).toHaveBeenCalledExactlyOnceWith('WX', 3, 3)
    expect(dispatch.mock.calls[0][0].scrollIntoView).toHaveBeenCalledOnce()
  })

  it('does not dispatch rejected input or an identical replacement', () => {
    const { view, dispatch } = viewStub()
    insertLimitedText(view, 3, 3, 'x', resolveLimits({ maxNoteCharacters: 6 }))
    insertLimitedText(view, 1, 3, 'bc', resolveLimits())
    expect(dispatch).not.toHaveBeenCalled()
    insertLimitedText(view, 1, 3, 'XYZ', resolveLimits({ maxNoteCharacters: 6 }))
    expect(dispatch.mock.calls[0][0].insertText).toHaveBeenCalledExactlyOnceWith('XY', 1, 3)
  })

  it('fits paste against the resulting document and preserves paste metadata', () => {
    const { view, dispatch } = viewStub()
    const slice = {} as Slice
    expect(insertLimitedPaste(view, slice, resolveLimits({ maxNoteCharacters: 8 }))).toBe(true)
    expect(dispatch).toHaveBeenCalledOnce()
    const tr = dispatch.mock.calls[0][0]
    expect(tr.replaceSelection).toHaveBeenCalledExactlyOnceWith({ end: 2 })
    expect(tr.setMeta.mock.calls).toEqual([['paste', true], ['uiEvent', 'paste']])
  })

  it('leaves the document alone when no pasted prefix fits or changes it', () => {
    const rejected = viewStub()
    insertLimitedPaste(rejected.view, {} as Slice, resolveLimits({ maxNoteCharacters: 6 }))
    expect(rejected.dispatch).not.toHaveBeenCalled()
    const unchanged = viewStub('same', () => ['same'])
    insertLimitedPaste(unchanged.view, {} as Slice, resolveLimits())
    expect(unchanged.dispatch).not.toHaveBeenCalled()
  })
})

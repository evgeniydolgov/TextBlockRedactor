import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'
import { mixedNote, paragraph } from '../testing/noteFixtures'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'

describe('note conversion', () => {
  it('maps all block types and preserves text, order, props and IDs on round trip', () => {
    const note = mixedNote()
    const before = structuredClone(note)
    const doc = blocksToTiptap(note)
    expect(doc).toEqual({ type: 'doc', content: [
      { type: 'paragraph', attrs: { id: 'p1' }, content: [{ type: 'text', text: '  Привет 🌍 ' }] },
      { type: 'heading', attrs: { id: 'h1', level: 1 }, content: [{ type: 'text', text: 'Один' }] },
      { type: 'heading', attrs: { id: 'h2', level: 2 }, content: [{ type: 'text', text: 'Два' }] },
      { type: 'heading', attrs: { id: 'h3', level: 3 }, content: [] },
      { type: 'paragraph', attrs: { id: 'empty' }, content: [] },
    ] })
    expect(tiptapToBlocks(doc)).toEqual(note)
    expect(note).toEqual(before)
  })

  it('coalesces adjacent text without trimming and never creates empty text nodes', () => {
    const block = paragraph()
    block.content = ['', '  ', 'Текст', ' 🌍'].map((text) => ({ type: 'text', text, styles: {} }))
    const doc = blocksToTiptap([block])
    expect(doc.content?.[0].content).toEqual([{ type: 'text', text: '  Текст 🌍' }])
    expect(tiptapToBlocks(doc)[0].content).toEqual([{ type: 'text', text: '  Текст 🌍', styles: {} }])
    expect(blocksToTiptap([paragraph()]).content?.[0].content).toEqual([])
    expect(tiptapToBlocks({ type: 'doc', content: [{ type: 'paragraph', attrs: { id: 'a' } }] }))
      .toEqual([paragraph('a')])
  })

  it('exports a fresh snapshot without mutating the input or previous output', () => {
    const doc = blocksToTiptap(mixedNote())
    const before = structuredClone(doc)
    const first = tiptapToBlocks(doc)
    expect(tiptapToBlocks(doc)).toEqual(first)
    expect(doc).toEqual(before)
    const second = tiptapToBlocks(doc)
    second[0].content[0].text = 'Изменено'
    expect(first[0].content[0].text).toBe('  Привет 🌍 ')
    expect(doc).toEqual(before)
  })

  it('joins separate internal text fragments', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', attrs: { id: 'p' },
      content: [{ type: 'text', text: 'а ' }, { type: 'text', text: 'б' }] }] }
    expect(tiptapToBlocks(doc)).toEqual([paragraph('p', 'а б')])
  })

  it.each([
    { type: 'paragraph' }, { type: 'doc' },
    { type: 'doc', content: [{ type: 'image' }] },
    { type: 'doc', content: [{ type: 'paragraph' }] },
    { type: 'doc', content: [{ type: 'heading', attrs: { id: 'h', level: 4 } }] },
    { type: 'doc', content: [{ type: 'paragraph', attrs: { id: 'p' }, marks: [{ type: 'bold' }] }] },
    ...[
      { type: 'hardBreak' }, { type: 'text' },
      { type: 'text', text: 'x', marks: [{ type: 'bold' }] },
      { type: 'text', text: 'x', content: [] },
    ].map((part) => ({ type: 'doc', content: [{ type: 'paragraph', attrs: { id: 'p' }, content: [part] }] })),
    { type: 'doc', content: [0, 1].map(() => ({ type: 'paragraph', attrs: { id: 'same' } })) },
  ] as JSONContent[])('rejects unsupported internal data', (doc) => {
    expect(() => tiptapToBlocks(doc)).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import { paragraph, heading, populatedImage } from '../../editor/testing/noteFixtures'
import { diffBlocks } from './diffBlocks'
import { createAttachment } from '../../editor/model/noteBlock'

describe('diffBlocks', () => {
  it('compares empty attachments after JSON without false updates', () => {
    const blocks = [createAttachment('image', 'i'), createAttachment('file', 'f')]
    expect(diffBlocks(blocks, JSON.parse(JSON.stringify(blocks))))
      .toEqual({ deleted: [], updated: [], createdIds: new Set() })
    expect(diffBlocks(blocks, [blocks[1]]).deleted).toEqual(['i'])
  })
  it('recognizes populated image prop updates', () => {
    const original = createAttachment('image', 'i')
    const populated = populatedImage('i')
    expect(diffBlocks([original], [populated]).updated).toEqual([populated])
    expect(diffBlocks([populated], [structuredClone(populated)]).updated).toEqual([])
  })
  it('compares content semantically without changing inputs or IDs', () => {
    const original = paragraph('123', 'Привет 🌍')
    const equivalent = structuredClone(original)
    if (equivalent.type === 'paragraph') {
      equivalent.props = { textAlignment: 'left', textColor: 'default', backgroundColor: 'default' }
    }
    equivalent.content = [
      { type: 'text' as const, text: 'Привет ', styles: {} },
      { type: 'text' as const, text: '🌍', styles: {} },
    ]
    const before = structuredClone(original)
    expect(diffBlocks([original], [equivalent]).updated).toEqual([])
    expect(original).toEqual(before)
    expect(diffBlocks([paragraph()], [{ ...paragraph(), content: [
      { type: 'text', text: '', styles: {} },
    ] }]).updated).toEqual([])
  })

  it.each([
    [paragraph('a', 'one'), paragraph('a', 'two')],
    [paragraph('a'), heading(1, 'a')],
    [heading(1, 'a'), heading(2, 'a')],
    [heading(3, 'a'), paragraph('a')],
  ])('recognizes text and type changes', (old, current) => {
    expect(diffBlocks([old], [current]).updated).toEqual([current])
  })

  it('ignores index shifts and does not invent move requests', () => {
    const a = paragraph('a')
    const b = paragraph('b')
    expect(diffBlocks([a, b], [b, a])).toEqual({ deleted: [], updated: [], createdIds: new Set() })
    expect(diffBlocks([a], [b, a])).toEqual({ deleted: [], updated: [], createdIds: new Set(['b']) })
  })
})

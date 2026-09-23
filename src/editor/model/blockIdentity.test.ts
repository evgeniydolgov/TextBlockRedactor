import { expect, it } from 'vitest'
import { paragraph, heading } from '../testing/noteFixtures'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'

it('preserves mixed legacy and UUID IDs through loading and export', () => {
  const ids = ['123', '550e8400-e29b-41d4-a716-446655440000', '0197cc01-8ee0-7000-8000-000000000001']
  const note = ids.map((id) => paragraph(id, 'Текст'))
  expect(tiptapToBlocks(blocksToTiptap(note))).toEqual(note)
})

it('preserves IDs through supplied edit, type, insertion, deletion and restored states', () => {
  const states = [
    [paragraph('a', 'До'), paragraph('b')],
    [paragraph('a', 'После'), paragraph('b')],
    [heading(2, 'a', 'После'), paragraph('b')],
    [heading(2, 'a', 'После'), paragraph('new', 'Новый'), paragraph('b')],
    [heading(2, 'a', 'После'), paragraph('b')],
    [heading(2, 'a', 'После'), paragraph('new', 'Новый'), paragraph('b')],
  ]
  for (const state of states) {
    const doc = blocksToTiptap(state)
    expect(tiptapToBlocks(doc)).toEqual(state)
    expect(tiptapToBlocks(doc).map((block) => block.id)).toEqual(state.map((block) => block.id))
  }
})

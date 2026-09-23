import { expect, it } from 'vitest'
import { paragraph, heading } from '../testing/noteFixtures'
import { blocksToTiptap } from './blocksToTiptap'
import { tiptapToBlocks } from './tiptapToBlocks'

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

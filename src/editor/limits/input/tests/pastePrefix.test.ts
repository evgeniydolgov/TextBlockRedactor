import type { Slice } from '@tiptap/pm/model'
import { describe, expect, it, vi } from 'vitest'
import { pasteEnds, pastePrefix } from '../pastePrefix'

function sliceStub(texts: string[], inline = false) {
  let size = 0
  const nodes = texts.map(textContent => {
    const node = { textContent, nodeSize: textContent.length + (inline ? 0 : 2), isText: inline }
    const pos = size
    size += node.nodeSize
    return { node, pos }
  })
  const cut = vi.fn(() => ({ size: 1 }))
  const slice = {
    content: { size, cut, forEach: (visit: (node: unknown, pos: number) => void) => nodes.forEach(({ node, pos }) => visit(node, pos)) },
    openStart: inline ? 0 : 1, openEnd: inline ? 0 : 1,
  } as unknown as Slice
  return { slice, cut }
}

describe('clipboard prefix adapter', () => {
  it('enumerates character and block boundaries without cutting pairs', () => {
    expect(pasteEnds(sliceStub(['a😀', '', 'x']).slice)).toEqual([2, 4, 5, 6, 7, 8, 9, 10])
    expect(pasteEnds(sliceStub(['a😀'], true).slice)).toEqual([1, 3])
    expect(pasteEnds(sliceStub([]).slice)).toEqual([])
  })

  it('opens the last partial block and preserves the original full slice', () => {
    const { slice, cut } = sliceStub(['abc', 'de'])
    const prefix = pastePrefix(slice, 3)
    expect(cut).toHaveBeenCalledExactlyOnceWith(0, 3)
    expect(prefix.openStart).toBe(1)
    expect(prefix.openEnd).toBe(1)
    expect(pastePrefix(slice, 5).openEnd).toBe(0)
    expect(pastePrefix(slice, slice.content.size)).toBe(slice)
    expect(pastePrefix(sliceStub(['abc'], true).slice, 1).openEnd).toBe(0)
  })

  it('handles a large pasted paragraph without a spread argument overflow', () => {
    const ends = pasteEnds(sliceStub(['x'.repeat(150000)]).slice)
    expect(ends).toHaveLength(150001)
    expect(ends.at(-1)).toBe(150002)
  })
})

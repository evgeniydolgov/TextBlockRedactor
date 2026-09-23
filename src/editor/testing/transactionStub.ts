import type { CommandProps } from '@tiptap/core'
import { vi } from 'vitest'

type StubNode = { type: { name: string }; attrs: Record<string, unknown>; nodeSize: number }

export function transactionStub(dispatch = true) {
  const nodes = new Map<number, StubNode>([
    [0, { type: { name: 'paragraph' }, attrs: { id: 'a' }, nodeSize: 5 }],
    [5, { type: { name: 'heading' }, attrs: { id: 'b', level: 2 }, nodeSize: 6 }],
  ])
  const map = vi.fn((pos: number, _assoc?: number) => pos)
  const slice = vi.fn((_start: number) => ({ map }))
  const tr = {
    selection: { from: 1, to: 9, $from: {
      depth: 1, before: () => 0, parent: { attrs: { id: 'a' as unknown } },
    } },
    mapping: { maps: [], slice },
    doc: {
      nodeAt: vi.fn((pos: number) => nodes.get(pos)),
      nodesBetween: vi.fn((_from: number, _to: number, visit: (node: StubNode, pos: number) => void) => {
        nodes.forEach((node, pos) => visit(node, pos))
      }),
    },
    setNodeMarkup: vi.fn((pos: number, _type: unknown, attrs: Record<string, unknown>) => {
      const node = nodes.get(pos)
      if (node) node.attrs = attrs
    }),
  }
  const props = { tr, dispatch: dispatch ? vi.fn() : undefined } as unknown as CommandProps
  return { props, tr, nodes, map, slice }
}

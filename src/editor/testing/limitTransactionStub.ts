import type { Node } from '@tiptap/pm/model'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import { vi } from 'vitest'

export function textDoc(texts: string[], ids = texts.map((_, index) => `id-${index}`), types = texts.map(() => 'paragraph')) {
  const paragraph = { name: 'paragraph' }
  let pos = 0
  const nodes = texts.map((text, index) => {
    const node = { type: { name: types[index] }, textContent: text, nodeSize: ['image', 'file'].includes(types[index]) ? 1 : text.length + 2, attrs: { id: ids[index] } }
    const entry = { node, pos }
    pos += node.nodeSize
    return entry
  })
  return {
    type: { schema: { nodes: { paragraph } } },
    forEach: (visit: (node: unknown, pos: number) => void) => nodes.forEach(entry => visit(entry.node, entry.pos)),
  } as unknown as Node
}

// Records our adapter's instructions, without reproducing ProseMirror transforms.
export function limitTransactionStub(texts: string[], ids?: string[]) {
  const tr = {
    doc: textDoc(texts, ids),
    docChanged: false,
    delete: vi.fn((_from: number, _to: number) => { tr.docChanged = true; return tr }),
    split: vi.fn((_pos: number, _depth: number, _types: unknown) => { tr.docChanged = true; return tr }),
    setMeta: vi.fn((_key: string, _value: unknown) => tr),
  }
  return { tr, state: { tr } as unknown as EditorState, transaction: tr as unknown as Transaction }
}

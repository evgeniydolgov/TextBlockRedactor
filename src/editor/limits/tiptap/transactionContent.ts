import type { Node } from '@tiptap/pm/model'
import type { Transaction } from '@tiptap/pm/state'
import { createId } from '../../../shared/ids'
import { isAttachmentType } from '../../model/note/noteBlock'
import type { ContentLimits } from '../core/limits'
import { fitsContent, planContent, splitEnds } from '../core/textBudget'

export function readTextBlocks(doc: Pick<Node, 'forEach'>) {
  const blocks: { node: Node; pos: number; text: string }[] = []
  doc.forEach((node, pos) => blocks.push({ node, pos, text: node.textContent }))
  return blocks
}

export function fitsTransaction(tr: Pick<Transaction, 'docChanged' | 'doc'>, limits: ContentLimits) {
  return !tr.docChanged || fitsContent(readTextBlocks(tr.doc).map(block => block.text), limits)
}

// Work backwards so each edit uses positions from the original transaction doc.
// Raw splits keep the first node's ID; continuations get distinct paragraph IDs.
export function normalizeTransaction(
  tr: Transaction,
  limits: ContentLimits,
  trim = false,
  generateId = createId,
): Transaction {
  const blocks = readTextBlocks(tr.doc)
  const texts = blocks.map(block => block.text)
  const parts = trim ? planContent(texts, limits, blocks.map(block => isAttachmentType(block.node.type.name))) : texts.flatMap((text, index) => {
    let start = 0
    return splitEnds(text, limits.maxBlockCharacters).map(end => {
      const part = { index, start, end }
      start = end
      return part
    })
  })
  const ids = new Set(blocks.map(block => block.node.attrs.id))
  for (let index = blocks.length - 1; index >= 0; index--) {
    const { node, pos, text } = blocks[index]
    const retained = parts.filter(part => part.index === index)
    if (!retained.length) {
      tr.delete(pos, pos + node.nodeSize)
      continue
    }
    const end = retained.at(-1)!.end
    if (end < text.length) tr.delete(pos + 1 + end, pos + 1 + text.length)
    for (const part of retained.slice(1).reverse()) {
      let id = generateId()
      while (ids.has(id)) id = generateId()
      ids.add(id)
      tr.split(pos + 1 + part.start, 1, [{ type: tr.doc.type.schema.nodes.paragraph, attrs: { id } }])
    }
  }
  return tr
}

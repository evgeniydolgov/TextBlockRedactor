import type { NoteBlock, NoteDocument } from '../../editor/model/note/noteBlock'

export function createMemoryPutAdapter(initial: NoteDocument, initialDelayMs = 0) {
  const blocks = new Map(initial.map(block => [block.id, structuredClone(block)]))
  const failures = new Set<string>()
  let delayMs = initialDelayMs

  async function putBlock(block: NoteBlock): Promise<void> {
    if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs))
    if (failures.has(block.id)) throw new Error(`PUT ${block.id} отклонён`)
    if (!blocks.has(block.id)) throw new Error(`Блок ${block.id} отсутствует`)
    blocks.set(block.id, structuredClone(block))
  }

  return {
    putBlock,
    getBlock: (id: string) => {
      const block = blocks.get(id)
      return block ? structuredClone(block) : null
    },
    setDelay: (value: number) => { delayMs = Math.max(0, value) },
    setFailure: (id: string, enabled: boolean) => {
      if (enabled) failures.add(id)
      else failures.delete(id)
    },
  }
}

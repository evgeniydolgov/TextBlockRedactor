import type { NoteBlock, NoteDocument } from '../../editor/model/note/noteBlock'

export type PutBlock = (block: NoteBlock) => Promise<void>
export type PutQueueStatus = {
  active: number
  pending: number
  errorIds: string[]
  structural: boolean
  synchronized: boolean
}

type PutQueueOptions = {
  confirmed: NoteDocument
  blockedIds?: string[]
  putBlock: PutBlock
  persistState?: (confirmed: NoteDocument, blockedIds: string[]) => boolean
  onConfirmed?: (confirmed: NoteDocument) => void
  onStatus?: (status: PutQueueStatus) => void
}

const MAX_ACTIVE = 4
const copy = <T>(value: T): T => structuredClone(value)
const same = (left: NoteBlock, right: NoteBlock) => JSON.stringify(left) === JSON.stringify(right)

export function createPutQueue(options: PutQueueOptions) {
  let confirmed = copy(options.confirmed)
  let current = copy(options.confirmed)
  const blocked = new Set(options.blockedIds ?? [])
  const active = new Set<string>()
  let destroyed = false

  function getStatus(): PutQueueStatus {
    const baseline = new Map(confirmed.map(block => [block.id, block]))
    const changed = current.filter(block => {
      const old = baseline.get(block.id)
      return old && !same(block, old)
    })
    const structural = current.length !== confirmed.length ||
      current.some((block, index) => block.id !== confirmed[index]?.id)
    const errorIds = [...blocked].filter(id => !active.has(id))
    const pending = changed.filter(block => !blocked.has(block.id)).length
    return {
      active: active.size, pending, errorIds, structural,
      synchronized: !structural && !active.size && !blocked.size && !changed.length,
    }
  }

  function notify() {
    if (!destroyed) options.onStatus?.(getStatus())
  }

  function persist(nextConfirmed: NoteDocument, nextBlocked: Set<string>) {
    try {
      return options.persistState?.(copy(nextConfirmed), [...nextBlocked]) !== false
    } catch {
      return false
    }
  }

  function finish(id: string, sent: NoteBlock, successful: boolean) {
    if (destroyed) return
    active.delete(id)
    if (successful) {
      const nextConfirmed = confirmed.map(block => block.id === id ? copy(sent) : block)
      const nextBlocked = new Set(blocked)
      nextBlocked.delete(id)
      if (persist(nextConfirmed, nextBlocked)) {
        confirmed = nextConfirmed
        blocked.delete(id)
        options.onConfirmed?.(copy(confirmed))
      }
    }
    notify()
    pump()
  }

  function pump() {
    if (destroyed) return
    const baseline = new Map(confirmed.map(block => [block.id, block]))
    for (const block of current) {
      if (active.size >= MAX_ACTIVE) break
      const old = baseline.get(block.id)
      if (!old || same(block, old) || blocked.has(block.id)) continue
      const sent = copy(block)
      const nextBlocked = new Set(blocked).add(block.id)
      blocked.add(block.id)
      if (!persist(confirmed, nextBlocked)) continue
      active.add(block.id)
      try {
        Promise.resolve(options.putBlock(sent)).then(
          () => finish(block.id, sent, true),
          () => finish(block.id, sent, false),
        )
      } catch {
        finish(block.id, sent, false)
      }
    }
    notify()
  }

  function update(document: NoteDocument) {
    if (destroyed) return
    current = copy(document)
    pump()
  }

  return {
    update,
    getConfirmed: () => copy(confirmed),
    getStatus,
    destroy: () => { destroyed = true },
  }
}

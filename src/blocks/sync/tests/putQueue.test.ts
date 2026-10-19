import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NoteBlock } from '../../../editor/model/note/noteBlock'
import { paragraph } from '../../../editor/testing/noteFixtures'
import { createMemoryPutAdapter } from '../createMemoryPutAdapter'
import { createPutQueue } from '../putQueue'

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => vi.useRealTimers())

describe('putQueue', () => {
  it('starts up to four changed existing IDs concurrently and confirms out of order', async () => {
    const baseline = Array.from({ length: 6 }, (_, i) => paragraph(String(i + 1), 'old'))
    const pending = new Map<string, ReturnType<typeof deferred>>()
    const putBlock = vi.fn((block: { id: string }) => {
      const request = deferred()
      pending.set(block.id, request)
      return request.promise
    })
    const queue = createPutQueue({ confirmed: baseline, putBlock })
    const changed = baseline.map((block, i) =>
      i === 0 ? block : paragraph(block.id, 'new'))

    queue.update(changed)
    expect(putBlock).toHaveBeenCalledTimes(4)
    expect(putBlock.mock.calls.map(([block]) => block.id)).toEqual(['2', '3', '4', '5'])
    expect(queue.getStatus().active).toBe(4)

    pending.get('4')!.resolve()
    await settle()
    expect(queue.getConfirmed().find(block => block.id === '4')).toEqual(changed[3])
    expect(queue.getConfirmed().find(block => block.id === '2')).toEqual(baseline[1])
    expect(putBlock).toHaveBeenCalledTimes(5)
    expect(putBlock.mock.calls[4][0]).toEqual(changed[5])

    for (const request of pending.values()) request.resolve()
    await settle()
    expect(queue.getConfirmed()).toEqual(changed)
    expect(queue.getStatus().synchronized).toBe(true)
    queue.destroy()
  })

  it('sends A then the latest C for one ID and never replaces local C with the A acknowledgement', async () => {
    const first = deferred()
    const second = deferred()
    const putBlock = vi.fn((_block: NoteBlock): Promise<void> => Promise.resolve())
      .mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const onConfirmed = vi.fn()
    const queue = createPutQueue({ confirmed: [paragraph('2', 'original')], putBlock, onConfirmed })
    const a = paragraph('2', 'A')
    const c = paragraph('2', 'C')

    queue.update([a])
    queue.update([paragraph('2', 'B')])
    queue.update([c])
    expect(putBlock).toHaveBeenCalledExactlyOnceWith(a)
    expect(queue.getStatus().active).toBe(1)

    first.resolve()
    await settle()
    expect(onConfirmed).toHaveBeenCalledWith([a])
    expect(queue.getConfirmed()).toEqual([a])
    expect(putBlock).toHaveBeenCalledTimes(2)
    expect(putBlock.mock.calls[1][0]).toEqual(c)

    second.resolve()
    await settle()
    expect(queue.getConfirmed()).toEqual([c])
    expect(queue.getStatus().synchronized).toBe(true)
    queue.destroy()
  })

  it('never PUTs a new ID and does not send another version of a deleted block', async () => {
    const first = deferred()
    const putBlock = vi.fn(() => first.promise)
    const queue = createPutQueue({ confirmed: [paragraph('old', 'A')], putBlock })

    queue.update([paragraph('old', 'B'), paragraph('new', 'local')])
    expect(putBlock).toHaveBeenCalledExactlyOnceWith(paragraph('old', 'B'))
    expect(queue.getStatus().structural).toBe(true)
    queue.update([paragraph('new', 'local')])
    first.resolve()
    await settle()
    expect(putBlock).toHaveBeenCalledTimes(1)
    expect(queue.getStatus().synchronized).toBe(false)
    queue.destroy()
  })

  it('stops a failed ID without retrying and keeps other IDs moving', async () => {
    vi.useFakeTimers()
    const putBlock = vi.fn((block: { id: string }) =>
      block.id === 'bad' ? Promise.reject(new Error('offline')) : Promise.resolve())
    const queue = createPutQueue({
      confirmed: [paragraph('bad', 'A'), paragraph('good', 'A')], putBlock,
    })
    queue.update([paragraph('bad', 'B'), paragraph('good', 'B')])
    await settle()
    expect(queue.getConfirmed().find(block => block.id === 'good')).toEqual(paragraph('good', 'B'))
    expect(queue.getConfirmed().find(block => block.id === 'bad')).toEqual(paragraph('bad', 'A'))

    queue.update([paragraph('bad', 'C'), paragraph('good', 'B')])
    await vi.advanceTimersByTimeAsync(7000)
    expect(putBlock.mock.calls.filter(([block]) => block.id === 'bad')).toHaveLength(1)
    expect(queue.getStatus().errorIds).toContain('bad')
    expect(queue.getStatus().synchronized).toBe(false)
    queue.destroy()
  })

  it('does not send a newer version while the earlier PUT remains unanswered', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const putBlock = vi.fn(() => pending.promise)
    const queue = createPutQueue({ confirmed: [paragraph('2', 'original')], putBlock })

    queue.update([paragraph('2', 'A')])
    queue.update([paragraph('2', 'C')])
    await vi.advanceTimersByTimeAsync(7000)

    expect(putBlock).toHaveBeenCalledExactlyOnceWith(paragraph('2', 'A'))
    expect(queue.getConfirmed()).toEqual([paragraph('2', 'original')])
    expect(queue.getStatus().active).toBe(1)
    queue.destroy()
  })

  it('persists the unresolved marker before sending and blocks a failed marker write', () => {
    const confirmed = [paragraph('2', 'original')]
    const persistState = vi.fn(() => false)
    const putBlock = vi.fn(() => Promise.resolve())
    const queue = createPutQueue({ confirmed, putBlock, persistState })

    queue.update([paragraph('2', 'A')])

    expect(persistState).toHaveBeenCalledExactlyOnceWith(confirmed, ['2'])
    expect(putBlock).not.toHaveBeenCalled()
    expect(queue.getConfirmed()).toEqual(confirmed)
    expect(queue.getStatus().synchronized).toBe(false)
    queue.destroy()
  })

  it('restores an unresolved ID as blocked and does not send it after another update', () => {
    const confirmed = [paragraph('2', 'original'), paragraph('3', 'original')]
    const putBlock = vi.fn((_block: NoteBlock) => Promise.resolve())
    const queue = createPutQueue({ confirmed, blockedIds: ['2'], putBlock })

    queue.update([paragraph('2', 'C'), paragraph('3', 'B')])
    expect(putBlock).toHaveBeenCalledExactlyOnceWith(paragraph('3', 'B'))
    expect(queue.getStatus().errorIds).toContain('2')
    queue.update([paragraph('2', 'D'), paragraph('3', 'B')])
    expect(putBlock.mock.calls.filter(([block]) => block.id === '2')).toHaveLength(0)
    queue.destroy()
  })

  it('keeps the sent ID blocked when acknowledgement persistence fails', async () => {
    const first = deferred()
    const confirmed = [paragraph('2', 'original')]
    const persistState = vi.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
    const putBlock = vi.fn(() => first.promise)
    const queue = createPutQueue({ confirmed, putBlock, persistState })

    queue.update([paragraph('2', 'A')])
    queue.update([paragraph('2', 'C')])
    first.resolve()
    await settle()

    expect(persistState).toHaveBeenNthCalledWith(1, confirmed, ['2'])
    expect(persistState).toHaveBeenNthCalledWith(2, [paragraph('2', 'A')], [])
    expect(putBlock).toHaveBeenCalledTimes(1)
    expect(queue.getStatus().synchronized).toBe(false)
    queue.destroy()
  })

  it('lets the demo adapter delay, reject, and then confirm a PUT', async () => {
    vi.useFakeTimers()
    const adapter = createMemoryPutAdapter([paragraph('2', 'original')], 50)
    const changed = paragraph('2', 'A')
    adapter.setFailure('2', true)

    const rejected = expect(adapter.putBlock(changed)).rejects.toThrow('PUT 2')
    expect(adapter.getBlock('2')).toEqual(paragraph('2', 'original'))
    await vi.advanceTimersByTimeAsync(50)
    await rejected
    expect(adapter.getBlock('2')).toEqual(paragraph('2', 'original'))

    adapter.setFailure('2', false)
    adapter.setDelay(25)
    const accepted = adapter.putBlock(changed)
    await vi.advanceTimersByTimeAsync(24)
    expect(adapter.getBlock('2')).toEqual(paragraph('2', 'original'))
    await vi.advanceTimersByTimeAsync(1)
    await accepted
    expect(adapter.getBlock('2')).toEqual(changed)
  })
})

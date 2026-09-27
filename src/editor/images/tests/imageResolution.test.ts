import { describe, expect, it, vi } from 'vitest'
import { createImageResolution, type ImageResolutionState } from '../imageResolution'
import type { ImageStorageAdapter, ResolvedImage } from '../imageStorage'

function deferred() {
  let resolve: (value: ResolvedImage) => void = () => undefined
  const promise = new Promise<ResolvedImage>(done => { resolve = done })
  return { promise, resolve }
}

describe('imageResolution', () => {
  it('handles empty, unavailable, direct URL and failed results without owned URLs', async () => {
    const states: ImageResolutionState[] = []
    let storage: ImageStorageAdapter | undefined
    const revokeObjectURL = vi.fn()
    const resolution = createImageResolution({
      getAdapter: () => storage,
      onStateChange: state => states.push(state),
      createObjectURL: vi.fn(),
      revokeObjectURL,
    })
    await resolution.resolve('')
    await resolution.resolve('missing-adapter')
    storage = { upload: vi.fn(), resolve: vi.fn(async () => ({ type: 'url', url: 'https://example/image' })) }
    await resolution.resolve('direct')
    storage.resolve = vi.fn(async () => { throw new Error('missing') })
    await resolution.retry()
    expect(states).toEqual([
      { type: 'idle' }, { type: 'unavailable' }, { type: 'loading' },
      { type: 'ready', src: 'https://example/image' }, { type: 'loading' }, { type: 'error' },
    ])
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it('owns Blob URLs and revokes them on replacement, retry and destroy', async () => {
    const blobs = [new Blob(['one']), new Blob(['two']), new Blob(['three'])]
    const storage: ImageStorageAdapter = {
      upload: vi.fn(),
      resolve: vi.fn(async () => ({ type: 'blob', blob: blobs.shift()! })),
    }
    const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.size}:${createObjectURL.mock.calls.length}`)
    const revokeObjectURL = vi.fn()
    const resolution = createImageResolution({
      getAdapter: () => storage,
      onStateChange: vi.fn(),
      createObjectURL,
      revokeObjectURL,
    })
    await resolution.resolve('one')
    await resolution.resolve('two')
    await resolution.retry()
    resolution.destroy()
    expect(createObjectURL).toHaveBeenCalledTimes(3)
    expect(revokeObjectURL.mock.calls.map(call => call[0])).toEqual(['blob:3:1', 'blob:3:2', 'blob:5:3'])
  })

  it('ignores stale results after a new request or destroy', async () => {
    const first = deferred()
    const second = deferred()
    const storage: ImageStorageAdapter = {
      upload: vi.fn(),
      resolve: vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    }
    const onStateChange = vi.fn()
    const createObjectURL = vi.fn(() => 'blob:current')
    const revokeObjectURL = vi.fn()
    const resolution = createImageResolution({
      getAdapter: () => storage, onStateChange, createObjectURL, revokeObjectURL,
    })
    const oldRequest = resolution.resolve('old')
    const currentRequest = resolution.resolve('current')
    first.resolve({ type: 'url', url: 'stale' })
    second.resolve({ type: 'blob', blob: new Blob(['current']) })
    await Promise.all([oldRequest, currentRequest])
    expect(onStateChange).not.toHaveBeenCalledWith({ type: 'ready', src: 'stale' })
    expect(onStateChange).toHaveBeenCalledWith({ type: 'ready', src: 'blob:current' })
    resolution.destroy()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:current')
  })
})

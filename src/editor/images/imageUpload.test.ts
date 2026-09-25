import { describe, expect, it, vi } from 'vitest'
import { createImageUpload, type ImageUploadState } from './imageUpload'
import type { ImageStorageAdapter } from './imageStorage'

describe('imageUpload', () => {
  it('reports loading and commits one successful result', async () => {
    const states: ImageUploadState[] = []
    const onUploaded = vi.fn()
    const storage: ImageStorageAdapter = {
      upload: vi.fn(async file => ({ id: 'stored', name: file.name })),
      resolve: vi.fn(),
    }
    const upload = createImageUpload({
      getAdapter: () => storage,
      onUploaded,
      onStateChange: state => states.push(state),
    })
    await expect(upload.upload(new File(['x'], 'photo.png'))).resolves.toBe(true)
    expect(states).toEqual(['loading', 'idle'])
    expect(onUploaded).toHaveBeenCalledExactlyOnceWith({ id: 'stored', name: 'photo.png' })
  })

  it('keeps the document callback untouched on errors, duplicate starts and destroy', async () => {
    let finish: ((value: { id: string; name: string }) => void) | undefined
    const storage: ImageStorageAdapter = {
      upload: vi.fn(() => new Promise(resolve => { finish = resolve })),
      resolve: vi.fn(),
    }
    const onUploaded = vi.fn()
    const onStateChange = vi.fn()
    const upload = createImageUpload({ getAdapter: () => storage, onUploaded, onStateChange })
    const first = upload.upload(new File(['x'], 'photo.png'))
    await expect(upload.upload(new File(['y'], 'second.png'))).resolves.toBe(false)
    upload.destroy()
    finish?.({ id: 'late', name: 'photo.png' })
    await expect(first).resolves.toBe(false)
    expect(onUploaded).not.toHaveBeenCalled()

    const failed = createImageUpload({
      getAdapter: () => ({ upload: vi.fn(async () => { throw new Error('failed') }), resolve: vi.fn() }),
      onUploaded,
      onStateChange,
    })
    await expect(failed.upload(new File([], 'bad.png'))).resolves.toBe(false)
    expect(failed.getState()).toBe('error')
    expect(onUploaded).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { createFileUpload } from '../fileUpload'
import type { FileStorageAdapter, UploadedFile } from '../fileStorage'

describe('file upload', () => {
  it('reports loading, prevents a second choice and commits one result', async () => {
    let finish: (value: UploadedFile) => void = () => undefined
    const adapter = {
      upload: vi.fn(() => new Promise<UploadedFile>(resolve => { finish = resolve })),
    } as unknown as FileStorageAdapter
    const onUploaded = vi.fn()
    const onStateChange = vi.fn()
    const upload = createFileUpload({ getAdapter: () => adapter, onUploaded, onStateChange })
    const pending = upload.upload(new File(['x'], 'report.pdf'))
    expect(upload.getState()).toBe('loading')
    await expect(upload.upload(new File(['y'], 'again.pdf'))).resolves.toBe(false)
    finish({ id: 'stored', name: 'report.pdf' })
    await expect(pending).resolves.toBe(true)
    expect(onUploaded).toHaveBeenCalledExactlyOnceWith({ id: 'stored', name: 'report.pdf' })
    expect(onStateChange.mock.calls.map(call => call[0])).toEqual(['loading', 'idle'])
  })

  it('allows retry after error and ignores completion after destroy', async () => {
    let finish: (value: UploadedFile) => void = () => undefined
    const adapter = {
      upload: vi.fn().mockRejectedValueOnce(new Error('failed'))
        .mockImplementation(() => new Promise<UploadedFile>(resolve => { finish = resolve })),
    } as unknown as FileStorageAdapter
    const onUploaded = vi.fn()
    const upload = createFileUpload({ getAdapter: () => adapter, onUploaded, onStateChange: vi.fn() })
    await expect(upload.upload(new File([], 'bad'))).resolves.toBe(false)
    expect(upload.getState()).toBe('error')
    const pending = upload.upload(new File([], 'retry'))
    upload.destroy()
    finish({ id: 'late', name: 'retry' })
    await expect(pending).resolves.toBe(false)
    expect(onUploaded).not.toHaveBeenCalled()
  })
})

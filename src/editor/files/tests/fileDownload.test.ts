import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFileDownload } from '../fileDownload'
import type { FileStorageAdapter, ResolvedFile } from '../fileStorage'

afterEach(() => vi.useRealTimers())

describe('file download', () => {
  it('resolves only on click, uses a direct URL and retries after failure', async () => {
    const adapter = {
      resolve: vi.fn().mockRejectedValueOnce(new Error('missing'))
        .mockResolvedValueOnce({ type: 'url', url: 'https://example.test/report' }),
    } as unknown as FileStorageAdapter
    const startDownload = vi.fn()
    const download = createFileDownload({ getAdapter: () => adapter, startDownload, onStateChange: vi.fn() })
    expect(adapter.resolve).not.toHaveBeenCalled()
    await expect(download.download('id', 'report.pdf')).resolves.toBe(false)
    expect(download.getState()).toBe('error')
    await expect(download.download('id', 'report.pdf')).resolves.toBe(true)
    expect(adapter.resolve).toHaveBeenCalledTimes(2)
    expect(startDownload).toHaveBeenCalledWith('https://example.test/report', 'report.pdf')
  })

  it('releases owned Blob URL after starting download and on destroy', async () => {
    vi.useFakeTimers()
    const adapter = { resolve: vi.fn(async () => ({ type: 'blob', blob: new Blob(['file']) })) } as unknown as FileStorageAdapter
    const revokeObjectURL = vi.fn()
    const startDownload = vi.fn()
    const download = createFileDownload({
      getAdapter: () => adapter, startDownload, onStateChange: vi.fn(),
      createObjectURL: () => 'blob:local', revokeObjectURL,
    })
    await download.download('id', 'report.pdf')
    expect(startDownload).toHaveBeenCalledWith('blob:local', 'report.pdf')
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:local')
    await download.download('id', 'report.pdf')
    download.destroy()
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('ignores a stale result after invalidation', async () => {
    let finish: (value: ResolvedFile) => void = () => undefined
    const adapter = { resolve: vi.fn(() => new Promise<ResolvedFile>(resolve => { finish = resolve })) } as unknown as FileStorageAdapter
    const startDownload = vi.fn()
    const download = createFileDownload({ getAdapter: () => adapter, startDownload, onStateChange: vi.fn() })
    const pending = download.download('old', 'old.txt')
    download.invalidate()
    finish({ type: 'url', url: 'https://example.test/old' })
    await expect(pending).resolves.toBe(false)
    expect(startDownload).not.toHaveBeenCalled()
  })
})

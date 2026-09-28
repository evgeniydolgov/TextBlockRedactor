import type { FileStorageAdapter } from './fileStorage'

export type FileDownloadState = 'idle' | 'loading' | 'error'

type FileDownloadOptions = {
  getAdapter: () => FileStorageAdapter | undefined
  onStateChange: (state: FileDownloadState) => void
  startDownload: (url: string, name: string) => void
  createObjectURL?: (blob: Blob) => string
  revokeObjectURL?: (url: string) => void
}

export function createFileDownload(options: FileDownloadOptions) {
  const createObjectURL = options.createObjectURL ?? URL.createObjectURL
  const revokeObjectURL = options.revokeObjectURL ?? URL.revokeObjectURL
  let state: FileDownloadState = 'idle'
  let generation = 0
  let destroyed = false
  let ownedUrl: string | undefined
  let releaseTimer: ReturnType<typeof setTimeout> | undefined

  const release = () => {
    if (releaseTimer !== undefined) clearTimeout(releaseTimer)
    releaseTimer = undefined
    if (ownedUrl) revokeObjectURL(ownedUrl)
    ownedUrl = undefined
  }
  const setState = (next: FileDownloadState) => {
    state = next
    options.onStateChange(next)
  }

  return {
    getState: () => state,
    async download(fileId: string, name: string) {
      const adapter = options.getAdapter()
      if (!adapter || !fileId || destroyed || state === 'loading') return false
      const current = ++generation
      setState('loading')
      try {
        const file = await adapter.resolve(fileId)
        if (current !== generation) return false
        release()
        const url = file.type === 'url' ? file.url : (ownedUrl = createObjectURL(file.blob))
        options.startDownload(url, name)
        if (ownedUrl) releaseTimer = setTimeout(release, 1000)
        setState('idle')
        return true
      } catch {
        if (current !== generation) return false
        release()
        setState('error')
        return false
      }
    },
    invalidate() {
      generation += 1
      release()
      setState('idle')
    },
    destroy() {
      destroyed = true
      generation += 1
      release()
    },
  }
}

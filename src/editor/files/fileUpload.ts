import type { FileStorageAdapter, UploadedFile } from './fileStorage'

export type FileUploadState = 'idle' | 'loading' | 'error'

type FileUploadOptions = {
  getAdapter: () => FileStorageAdapter | undefined
  onUploaded: (file: UploadedFile) => void
  onStateChange: (state: FileUploadState) => void
}

export function createFileUpload(options: FileUploadOptions) {
  let state: FileUploadState = 'idle'
  let generation = 0
  let destroyed = false

  const setState = (next: FileUploadState) => {
    state = next
    options.onStateChange(next)
  }

  return {
    getState: () => state,
    async upload(file: File) {
      const adapter = options.getAdapter()
      if (!adapter || state === 'loading' || destroyed) return false
      const current = ++generation
      setState('loading')
      try {
        const uploaded = await adapter.upload(file)
        if (current !== generation) return false
        options.onUploaded(uploaded)
        setState('idle')
        return true
      } catch {
        if (current !== generation) return false
        setState('error')
        return false
      }
    },
    destroy() {
      destroyed = true
      generation += 1
    },
  }
}

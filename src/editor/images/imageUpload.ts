import type { ImageStorageAdapter, UploadedImage } from './imageStorage'

export type ImageUploadState = 'idle' | 'loading' | 'error'

type ImageUploadOptions = {
  getAdapter: () => ImageStorageAdapter | undefined
  onUploaded: (image: UploadedImage) => void
  onStateChange: (state: ImageUploadState) => void
}

export function createImageUpload(options: ImageUploadOptions) {
  let state: ImageUploadState = 'idle'
  let generation = 0

  const setState = (next: ImageUploadState) => {
    state = next
    options.onStateChange(next)
  }

  return {
    getState: () => state,
    async upload(file: File) {
      const adapter = options.getAdapter()
      if (!adapter || state === 'loading') return false
      const current = ++generation
      setState('loading')
      try {
        const image = await adapter.upload(file)
        if (current !== generation) return false
        options.onUploaded(image)
        setState('idle')
        return true
      } catch {
        if (current !== generation) return false
        setState('error')
        return false
      }
    },
    destroy() {
      generation += 1
    },
  }
}

import type { ImageStorageAdapter } from './imageStorage'

export type ImageResolutionState =
  | { type: 'idle' }
  | { type: 'unavailable' }
  | { type: 'loading' }
  | { type: 'ready'; src: string }
  | { type: 'error' }

type ImageResolutionOptions = {
  getAdapter: () => ImageStorageAdapter | undefined
  onStateChange: (state: ImageResolutionState) => void
  createObjectURL?: (blob: Blob) => string
  revokeObjectURL?: (url: string) => void
}

export function createImageResolution(options: ImageResolutionOptions) {
  const createObjectURL = options.createObjectURL ?? URL.createObjectURL
  const revokeObjectURL = options.revokeObjectURL ?? URL.revokeObjectURL
  let generation = 0
  let fileId = ''
  let ownedUrl: string | undefined

  const releaseOwnedUrl = () => {
    if (!ownedUrl) return
    revokeObjectURL(ownedUrl)
    ownedUrl = undefined
  }

  const resolve = async (nextFileId: string) => {
    fileId = nextFileId
    const current = ++generation
    releaseOwnedUrl()
    if (!fileId) {
      options.onStateChange({ type: 'idle' })
      return
    }
    const adapter = options.getAdapter()
    if (!adapter) {
      options.onStateChange({ type: 'unavailable' })
      return
    }
    options.onStateChange({ type: 'loading' })
    try {
      const image = await adapter.resolve(fileId)
      if (current !== generation) return
      if (image.type === 'url') {
        options.onStateChange({ type: 'ready', src: image.url })
        return
      }
      ownedUrl = createObjectURL(image.blob)
      options.onStateChange({ type: 'ready', src: ownedUrl })
    } catch {
      if (current === generation) options.onStateChange({ type: 'error' })
    }
  }

  return {
    resolve,
    retry: () => resolve(fileId),
    destroy() {
      generation += 1
      releaseOwnedUrl()
    },
  }
}

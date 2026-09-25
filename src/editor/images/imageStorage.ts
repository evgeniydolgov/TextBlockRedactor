export type UploadedImage = {
  id: string
  name: string
}

export type ResolvedImage =
  | { type: 'url'; url: string }
  | { type: 'blob'; blob: Blob }

export type ImageStorageAdapter = {
  upload(file: File): Promise<UploadedImage>
  resolve(fileId: string): Promise<ResolvedImage>
}

export type ImageStorageController = ReturnType<typeof createImageStorageController>

export function createImageStorageController(initial?: ImageStorageAdapter) {
  let current = initial
  const listeners = new Set<() => void>()

  return {
    get: () => current,
    configure(next?: ImageStorageAdapter) {
      if (next === current) return
      current = next
      listeners.forEach(listener => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

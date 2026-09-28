export type UploadedFile = { id: string; name: string }

export type ResolvedFile =
  | { type: 'url'; url: string }
  | { type: 'blob'; blob: Blob }

export type FileStorageAdapter = {
  upload(file: File): Promise<UploadedFile>
  resolve(fileId: string): Promise<ResolvedFile>
}

export type FileStorageController = ReturnType<typeof createFileStorageController>

export function createFileStorageController(initial?: FileStorageAdapter) {
  let current = initial
  const listeners = new Set<() => void>()

  return {
    get: () => current,
    configure(next?: FileStorageAdapter) {
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

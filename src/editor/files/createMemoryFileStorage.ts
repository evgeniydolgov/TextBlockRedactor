import { createId } from '../../shared/ids'
import type { FileStorageAdapter } from './fileStorage'

export function createMemoryFileStorage(generateId = createId): FileStorageAdapter {
  const files = new Map<string, Blob>()

  return {
    async upload(file) {
      const id = generateId()
      files.set(id, file)
      return { id, name: file.name }
    },
    async resolve(fileId) {
      const blob = files.get(fileId)
      if (!blob) throw new Error('Файл не найден')
      return { type: 'blob', blob }
    },
  }
}

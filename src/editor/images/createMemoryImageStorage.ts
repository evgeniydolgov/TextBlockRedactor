import { createId } from '../../shared/ids'
import type { ImageStorageAdapter } from './imageStorage'

export function createMemoryImageStorage(generateId = createId): ImageStorageAdapter {
  const files = new Map<string, Blob>()

  return {
    async upload(file) {
      const id = generateId()
      files.set(id, file)
      return { id, name: file.name }
    },
    async resolve(fileId) {
      const blob = files.get(fileId)
      if (!blob) throw new Error('Изображение не найдено')
      return { type: 'blob', blob }
    },
  }
}

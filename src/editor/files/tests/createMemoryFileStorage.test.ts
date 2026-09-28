import { describe, expect, it } from 'vitest'
import { createMemoryFileStorage } from '../createMemoryFileStorage'

describe('memory file storage', () => {
  it('stores a File by generated ID and returns its Blob', async () => {
    const storage = createMemoryFileStorage(() => 'stored')
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' })
    expect(await storage.upload(file)).toEqual({ id: 'stored', name: 'report.pdf' })
    expect(await storage.resolve('stored')).toEqual({ type: 'blob', blob: file })
    await expect(storage.resolve('missing')).rejects.toThrow('Файл не найден')
  })
})

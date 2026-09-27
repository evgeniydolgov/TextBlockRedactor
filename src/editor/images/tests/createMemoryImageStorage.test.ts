import { describe, expect, it } from 'vitest'
import { createMemoryImageStorage } from '../createMemoryImageStorage'

describe('createMemoryImageStorage', () => {
  it('uploads files under generated IDs and resolves their original blobs', async () => {
    const ids = ['one', 'two']
    const storage = createMemoryImageStorage(() => ids.shift()!)
    const first = new File(['first'], 'first.png', { type: 'image/png' })
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' })
    await expect(storage.upload(first)).resolves.toEqual({ id: 'one', name: 'first.png' })
    await expect(storage.upload(second)).resolves.toEqual({ id: 'two', name: 'second.jpg' })
    await expect(storage.resolve('one')).resolves.toEqual({ type: 'blob', blob: first })
    await expect(storage.resolve('two')).resolves.toEqual({ type: 'blob', blob: second })
  })

  it('does not share blobs between adapter instances', async () => {
    const first = createMemoryImageStorage(() => 'id')
    const second = createMemoryImageStorage(() => 'id')
    await first.upload(new File(['image'], 'image.png'))
    await expect(second.resolve('id')).rejects.toThrow('Изображение не найдено')
  })
})

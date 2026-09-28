import { describe, expect, it, vi } from 'vitest'
import { createFileStorageController, type FileStorageAdapter } from '../fileStorage'

describe('file storage controller', () => {
  it('updates the active adapter and notifies only on change', () => {
    const first = {} as FileStorageAdapter
    const second = {} as FileStorageAdapter
    const controller = createFileStorageController(first)
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    controller.configure(first)
    expect(listener).not.toHaveBeenCalled()
    controller.configure(second)
    expect(controller.get()).toBe(second)
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
    controller.configure(undefined)
    expect(listener).toHaveBeenCalledOnce()
  })
})

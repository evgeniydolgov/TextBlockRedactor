import { describe, expect, it, vi } from 'vitest'
import { createImageStorageController, type ImageStorageAdapter } from './imageStorage'

const adapter = (): ImageStorageAdapter => ({
  upload: vi.fn(),
  resolve: vi.fn(),
})

describe('imageStorageController', () => {
  it('keeps the current optional adapter and notifies only on identity changes', () => {
    const first = adapter()
    const second = adapter()
    const controller = createImageStorageController()
    const listener = vi.fn()
    controller.subscribe(listener)
    expect(controller.get()).toBeUndefined()
    controller.configure(first)
    controller.configure(first)
    controller.configure(second)
    controller.configure(undefined)
    expect(listener).toHaveBeenCalledTimes(3)
    expect(controller.get()).toBeUndefined()
  })

  it('stops notifications after unsubscribe', () => {
    const controller = createImageStorageController(adapter())
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    unsubscribe()
    controller.configure(adapter())
    expect(listener).not.toHaveBeenCalled()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindSaveLifecycle } from './bindSaveLifecycle'
import { createDebouncedChange } from './createDebouncedChange'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function sources() {
  return {
    page: new EventTarget(),
    visibility: Object.assign(new EventTarget(), { visibilityState: 'visible' }),
  }
}

describe('bindSaveLifecycle', () => {
  it('flushes on hidden or pagehide, never on visible, without duplicate delivery', () => {
    const { page, visibility } = sources()
    const callback = vi.fn()
    const changes = createDebouncedChange(callback)
    const cleanup = bindSaveLifecycle(changes.flush, page, visibility)
    changes.schedule([])
    visibility.dispatchEvent(new Event('visibilitychange'))
    expect(callback).not.toHaveBeenCalled()
    visibility.visibilityState = 'hidden'
    visibility.dispatchEvent(new Event('visibilitychange'))
    expect(callback).toHaveBeenCalledExactlyOnceWith([])
    page.dispatchEvent(new Event('pagehide'))
    vi.runAllTimers()
    expect(callback).toHaveBeenCalledOnce()

    visibility.visibilityState = 'visible'
    visibility.dispatchEvent(new Event('visibilitychange'))
    changes.schedule([])
    page.dispatchEvent(new Event('pagehide'))
    expect(callback).toHaveBeenCalledTimes(2)
    cleanup()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('flushes on cleanup and removes both listeners', () => {
    const { page, visibility } = sources()
    const callback = vi.fn()
    const changes = createDebouncedChange(callback)
    const flush = vi.fn(changes.flush)
    const cleanup = bindSaveLifecycle(flush, page, visibility)
    changes.schedule([])
    cleanup()
    expect(callback).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    visibility.visibilityState = 'hidden'
    visibility.dispatchEvent(new Event('visibilitychange'))
    page.dispatchEvent(new Event('pagehide'))
    expect(flush).toHaveBeenCalledOnce()
  })

  it('supports setup-cleanup-setup and later updates without mount writes', () => {
    const { page, visibility } = sources()
    const callback = vi.fn()
    const changes = createDebouncedChange(callback)
    bindSaveLifecycle(changes.flush, page, visibility)()
    const cleanup = bindSaveLifecycle(changes.flush, page, visibility)
    expect(callback).not.toHaveBeenCalled()
    changes.schedule([])
    vi.advanceTimersByTime(1000)
    expect(callback).toHaveBeenCalledOnce()
    changes.schedule([])
    page.dispatchEvent(new Event('pagehide'))
    expect(callback).toHaveBeenCalledTimes(2)
    cleanup()
  })
})

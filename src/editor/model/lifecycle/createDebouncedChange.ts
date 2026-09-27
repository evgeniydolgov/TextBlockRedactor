import type { TextEditorProps } from '../document'
import type { NoteDocument } from '../note/noteBlock'

export const DEFAULT_SAVE_DELAY_MS = 1000

function normalizeDelay(value = DEFAULT_SAVE_DELAY_MS) {
  return Number.isFinite(value) && value >= 0 && value <= 2147483647
    ? value : DEFAULT_SAVE_DELAY_MS
}

export function createDebouncedChange(onChange?: TextEditorProps['onChange'], saveDelayMs?: number) {
  let callback = onChange
  let delay = normalizeDelay(saveDelayMs)
  let pending: NoteDocument | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  function clearTimer() {
    clearTimeout(timer)
    timer = undefined
  }

  function cancel() {
    clearTimer()
    pending = undefined
  }

  function flush() {
    const snapshot = pending
    cancel()
    if (snapshot !== undefined) callback?.(snapshot)
  }

  function restart() {
    clearTimer()
    if (delay === 0) flush()
    else timer = setTimeout(flush, delay)
  }

  function schedule(document: NoteDocument) {
    if (!callback) return
    pending = document
    restart()
  }

  function configure(nextCallback: TextEditorProps['onChange'], nextDelay?: number) {
    callback = nextCallback
    const normalized = normalizeDelay(nextDelay)
    const changed = normalized !== delay
    delay = normalized
    if (!callback) cancel()
    else if (changed && pending !== undefined) restart()
  }

  return { schedule, configure, flush, cancel }
}

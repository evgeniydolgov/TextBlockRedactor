type EventSource = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
type VisibilitySource = EventSource & { readonly visibilityState: string }

export function bindSaveLifecycle(
  flush: () => void,
  page: EventSource,
  visibility: VisibilitySource,
) {
  const onVisibilityChange = () => {
    if (visibility.visibilityState === 'hidden') flush()
  }

  page.addEventListener('pagehide', flush)
  visibility.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    page.removeEventListener('pagehide', flush)
    visibility.removeEventListener('visibilitychange', onVisibilityChange)
    flush()
  }
}

import type { BlockRequest } from '../../blocks/requests/types'

export function logBlockRequests(requests: BlockRequest[]) {
  if (requests.length) console.log('[note:requests]', structuredClone(requests))
}

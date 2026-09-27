import { afterEach, expect, it, vi } from 'vitest'
import { logBlockRequests } from '../logBlockRequests'
import type { BlockRequest } from '../../../blocks/requests/types'
import { paragraph } from '../../../editor/testing/noteFixtures'

afterEach(() => vi.restoreAllMocks())

it('skips empty requests and logs detached objects', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  logBlockRequests([])
  expect(log).not.toHaveBeenCalled()
  const block = paragraph('123', 'Original')
  const requests: BlockRequest[] = [{ method: 'PUT', path: '/blocks/123', body: block }]
  logBlockRequests(requests)
  block.content[0].text = 'Changed'
  expect(log).toHaveBeenCalledExactlyOnceWith('[note:requests]', [
    { method: 'PUT', path: '/blocks/123', body: paragraph('123', 'Original') },
  ])
})

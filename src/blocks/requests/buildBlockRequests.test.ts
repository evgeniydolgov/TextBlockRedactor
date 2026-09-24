import { describe, expect, it } from 'vitest'
import { paragraph } from '../../editor/testing/noteFixtures'
import { buildBlockRequests } from './buildBlockRequests'

const a = paragraph('a', 'A')
const b = paragraph('b', 'B')
const x = paragraph('x', 'X')
const y = paragraph('y', 'Y')

describe('buildBlockRequests', () => {
  it('creates one block with exact neighbors and no unsupported noteId', () => {
    expect(buildBlockRequests([a, b], [a, x, b], 'note')).toEqual([
      { method: 'POST', path: '/blocks', body: { block: x, position: { before: 'a', after: 'b' } } },
    ])
  })

  it.each([undefined, 'note'])('creates a consecutive group with optional note context %s', noteId => {
    expect(buildBlockRequests([a, b], [a, x, y, b], noteId)).toEqual([
      { method: 'POST', path: '/blocks/list', body: {
        operation: 'CREATE', blocks: [x, y], position: { before: 'a', after: 'b' },
        ...(noteId === undefined ? {} : { noteId }),
      } },
    ])
  })

  it('separates groups and handles both boundaries', () => {
    expect(buildBlockRequests([a], [x, a, y])).toEqual([
      { method: 'POST', path: '/blocks', body: { block: x, position: { before: null, after: 'a' } } },
      { method: 'POST', path: '/blocks', body: { block: y, position: { before: 'a', after: null } } },
    ])
    expect(buildBlockRequests([], [x, y])[0]).toEqual({ method: 'POST', path: '/blocks/list', body: {
      operation: 'CREATE', blocks: [x, y], position: { before: null, after: null },
    } })
  })

  it('deletes before updating and creating with surviving neighbors', () => {
    const changed = paragraph('a', 'Changed')
    const c = paragraph('c')
    const d = paragraph('d')
    expect(buildBlockRequests([a, b, c, d], [changed, x, y, d], 'note')).toEqual([
      { method: 'POST', path: '/blocks/list', body: { operation: 'DELETE', ids: ['b', 'c'], noteId: 'note' } },
      { method: 'PUT', path: '/blocks/a', body: changed },
      { method: 'POST', path: '/blocks/list', body: {
        operation: 'CREATE', blocks: [x, y], position: { before: 'a', after: 'd' }, noteId: 'note',
      } },
    ])
  })

  it('deletes nonadjacent IDs in their original order without extra fields', () => {
    expect(buildBlockRequests([a, b, x], [b])).toEqual([
      { method: 'POST', path: '/blocks/list', body: { operation: 'DELETE', ids: ['a', 'x'] } },
    ])
  })

  it('encodes legacy IDs in paths and keeps full update bodies', () => {
    const old = paragraph('a/b ?')
    const changed = paragraph('a/b ?', 'Новое')
    expect(buildBlockRequests([old], [])).toEqual([{ method: 'DELETE', path: '/blocks/a%2Fb%20%3F' }])
    expect(buildBlockRequests([old, a], [paragraph('a', 'new'), changed])).toEqual([
      { method: 'PUT', path: '/blocks/a', body: paragraph('a', 'new') },
      { method: 'PUT', path: '/blocks/a%2Fb%20%3F', body: changed },
    ])
  })

  it('handles split, merge and returns detached request bodies', () => {
    const full = paragraph('a', 'AB')
    const result = buildBlockRequests([full], [a, b])
    expect(result).toEqual([
      { method: 'PUT', path: '/blocks/a', body: a },
      { method: 'POST', path: '/blocks', body: { block: b, position: { before: 'a', after: null } } },
    ])
    expect(buildBlockRequests([a, b], [full])).toEqual([
      { method: 'DELETE', path: '/blocks/b' }, { method: 'PUT', path: '/blocks/a', body: full },
    ])
    if (result[0].method === 'PUT') result[0].body.content[0].text = 'Mutated'
    expect(a.content[0].text).toBe('A')
  })
})

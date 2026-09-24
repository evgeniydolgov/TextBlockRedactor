import { describe, expect, it } from 'vitest'
import { paragraph } from '../../editor/testing/noteFixtures'
import { createRequestPreview } from './createRequestPreview'

describe('createRequestPreview', () => {
  it('starts without requests and ignores changes reverted before processing', () => {
    const initial = [paragraph('123')]
    const preview = createRequestPreview(initial)
    expect(preview(initial)).toEqual([])
    expect(preview(structuredClone(initial))).toEqual([])
    expect(preview([paragraph('123', 'Текст')])).toEqual([
      { method: 'PUT', path: '/blocks/123', body: paragraph('123', 'Текст') },
    ])
    expect(preview([paragraph('123', 'Текст')])).toEqual([])
    expect(preview(initial)[0].method).toBe('PUT')
  })

  it('creates a restored ID after a processed deletion, preserving UUID v7', () => {
    const id = '0197cc01-8ee0-7000-8000-000000000001'
    const original = [paragraph(id)]
    const preview = createRequestPreview(original)
    expect(preview([])).toEqual([{ method: 'DELETE', path: `/blocks/${id}` }])
    expect(preview(original)).toEqual([{ method: 'POST', path: '/blocks', body: {
      block: original[0], position: { before: null, after: null },
    } }])
  })

  it('isolates initial data, current snapshots and returned request bodies', () => {
    const initial = [paragraph('a', 'Initial')]
    const preview = createRequestPreview(initial)
    initial[0].content[0].text = 'Outside mutation'
    expect(preview([paragraph('a', 'Initial')])).toEqual([])
    const current = [paragraph('a', 'Next')]
    const output = preview(current)
    current[0].content[0].text = 'Mutated input'
    expect(output).toEqual([{ method: 'PUT', path: '/blocks/a', body: paragraph('a', 'Next') }])
    if (output[0].method === 'PUT') output[0].body.content[0].text = 'Mutated output'
    expect(preview([paragraph('a', 'Next')])).toEqual([])
  })
})

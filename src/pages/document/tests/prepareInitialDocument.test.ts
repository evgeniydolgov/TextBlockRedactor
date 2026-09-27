import { describe, expect, it } from 'vitest'
import { validate, version } from 'uuid'
import { prepareInitialDocument } from '../prepareInitialDocument'
import { createRequestPreview } from '../../../blocks/requests/createRequestPreview'
import { mixedNote } from '../../../editor/testing/noteFixtures'

describe('prepareInitialDocument', () => {
  it('preserves loaded content and IDs', () => {
    const loaded = mixedNote()
    expect(prepareInitialDocument(loaded)).toBe(loaded)
  })

  it('shares a single empty block with preview and makes first input a PUT', () => {
    const initial = prepareInitialDocument([])
    expect(initial).toHaveLength(1)
    expect(validate(initial[0].id)).toBe(true)
    expect(version(initial[0].id)).toBe(7)
    const preview = createRequestPreview(initial)
    expect(preview(initial)).toEqual([])
    const current = structuredClone(initial)
    current[0].content = [{ type: 'text', text: 'Начало', styles: {} }]
    expect(preview(current)[0]).toEqual({ method: 'PUT', path: `/blocks/${initial[0].id}`, body: current[0] })
  })
})

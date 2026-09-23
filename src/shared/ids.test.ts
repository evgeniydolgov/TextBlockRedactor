import { expect, it } from 'vitest'
import { validate, version } from 'uuid'
import { createId } from './ids'

it('creates distinct UUID v7 identifiers', () => {
  const ids = Array.from({ length: 10 }, () => createId())
  for (const id of ids) {
    expect(validate(id)).toBe(true)
    expect(version(id)).toBe(7)
  }
  expect(new Set(ids).size).toBe(ids.length)
})

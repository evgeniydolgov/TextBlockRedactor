import { expect, it, vi } from 'vitest'
import { createEmptyNote } from '../createEmptyNote'
import { validate, version } from 'uuid'

it('creates independent blocks with IDs from the generator', () => {
  const generateId = vi.fn().mockReturnValueOnce('a').mockReturnValueOnce('b')
  const first = createEmptyNote(generateId)
  const second = createEmptyNote(generateId)
  expect(first).toEqual([{
    id: 'a', type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [], children: [],
  }])
  expect(second[0].id).toBe('b')
  expect(first[0].props).not.toBe(second[0].props)
  expect(first[0].content).not.toBe(second[0].content)
  expect(first[0].children).not.toBe(second[0].children)
})

it('generates distinct nonempty IDs by default', () => {
  const first = createEmptyNote()[0].id
  expect(first).not.toBe('')
  expect(validate(first)).toBe(true)
  expect(version(first)).toBe(7)
  expect(createEmptyNote()[0].id).not.toBe(first)
})

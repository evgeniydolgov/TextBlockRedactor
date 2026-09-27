import { expect, it, vi } from 'vitest'
import { transactionStub } from '../../testing/transactionStub'
import { splitWithBlockIds } from '../splitWithBlockIds'
import { validate, version } from 'uuid'

it.each([2, 5, 12])('keeps the original ID on the first fragment of size %s', (size) => {
  const { props, tr, nodes, map, slice } = transactionStub()
  const generateId = vi.fn(() => 'new-id')
  const split = vi.fn(() => {
    nodes.clear()
    nodes.set(0, { type: { name: 'paragraph' }, attrs: { id: null }, nodeSize: size })
    nodes.set(size, { type: { name: 'heading' }, attrs: { id: 'a', level: 2 }, nodeSize: 4 })
    return true
  })
  expect(splitWithBlockIds(split, generateId)(props)).toBe(true)
  expect(split).toHaveBeenCalledExactlyOnceWith(props)
  expect(slice).toHaveBeenCalledWith(0)
  expect(map).toHaveBeenCalledWith(0, -1)
  expect(tr.setNodeMarkup.mock.calls).toEqual([
    [0, undefined, { id: 'a' }], [size, undefined, { id: 'new-id', level: 2 }],
  ])
  expect(generateId).toHaveBeenCalledTimes(1)
  expect(split.mock.invocationCallOrder[0]).toBeLessThan(tr.setNodeMarkup.mock.invocationCallOrder[0])
})

it.each([
  { result: false, dispatch: true }, { result: true, dispatch: false },
])('does not assign IDs for failure or can(): %j', ({ result, dispatch }) => {
  const { props, tr } = transactionStub(dispatch)
  const generateId = vi.fn(() => 'unused')
  expect(splitWithBlockIds(() => result, generateId)(props)).toBe(result)
  expect(generateId).not.toHaveBeenCalled()
  expect(tr.setNodeMarkup).not.toHaveBeenCalled()
})

it.each(['root', 'missing-id', 'missing-first', 'missing-second'])('handles %s without writes', (kind) => {
  const { props, tr, nodes } = transactionStub()
  if (kind === 'root') tr.selection.$from.depth = 0
  if (kind === 'missing-id') tr.selection.$from.parent.attrs.id = null
  if (kind === 'missing-first') nodes.delete(0)
  if (kind === 'missing-second') nodes.delete(5)
  splitWithBlockIds(() => true)(props)
  expect(tr.setNodeMarkup).not.toHaveBeenCalled()
})

it('uses a fresh UUID by default', () => {
  const { props, nodes } = transactionStub()
  splitWithBlockIds(() => true)(props)
  expect(nodes.get(0)!.attrs.id).toBe('a')
  expect(nodes.get(5)!.attrs.id).toEqual(expect.any(String))
  expect(nodes.get(5)!.attrs.id).not.toBe('a')
  const id = nodes.get(5)!.attrs.id as string
  expect(validate(id)).toBe(true)
  expect(version(id)).toBe(7)
})

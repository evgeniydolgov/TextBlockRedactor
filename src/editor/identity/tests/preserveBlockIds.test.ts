import { expect, it, vi } from 'vitest'
import { transactionStub } from '../../testing/transactionStub'
import { preserveBlockIds } from '../preserveBlockIds'

it('restores each selected block ID after type changes in the same transaction', () => {
  const { props, tr, nodes } = transactionStub()
  const command = vi.fn(() => {
    nodes.get(0)!.attrs = { id: null, level: 3 }
    nodes.get(5)!.attrs = { id: null, level: 3 }
    return true
  })
  expect(preserveBlockIds(command)(props)).toBe(true)
  expect(command).toHaveBeenCalledExactlyOnceWith(props)
  expect(tr.setNodeMarkup.mock.calls).toEqual([
    [0, undefined, { id: 'a', level: 3 }], [5, undefined, { id: 'b', level: 3 }],
  ])
  expect(command.mock.invocationCallOrder[0]).toBeLessThan(tr.setNodeMarkup.mock.invocationCallOrder[0])
})

it.each([false, true])('does not write for unchanged IDs (dispatch=%s)', (dispatch) => {
  const { props, tr } = transactionStub(dispatch)
  expect(preserveBlockIds(() => true)(props)).toBe(true)
  expect(tr.setNodeMarkup).not.toHaveBeenCalled()
})

it('does not restore on failure', () => {
  const { props, tr } = transactionStub()
  expect(preserveBlockIds(() => false)(props)).toBe(false)
  expect(tr.setNodeMarkup).not.toHaveBeenCalled()
})

it('ignores other node types, missing IDs and removed nodes', () => {
  const { props, tr, nodes } = transactionStub()
  nodes.set(11, { type: { name: 'text' }, attrs: {}, nodeSize: 1 })
  nodes.get(5)!.attrs = { id: null }
  preserveBlockIds(() => { nodes.delete(0); return true })(props)
  expect(tr.setNodeMarkup).not.toHaveBeenCalled()
})

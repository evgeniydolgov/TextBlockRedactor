import { describe, expect, it } from 'vitest'
import { createEditorStub } from '../testing/editorStub'
import { paragraphBlock } from './paragraph'
import { headingBlocks } from './headings'

const cases = [
  { block: paragraphBlock, level: undefined },
  { block: headingBlocks[0], level: 1 },
  { block: headingBlocks[1], level: 2 },
  { block: headingBlocks[2], level: 3 },
]

describe.each(cases)('$block.id adapter', ({ block, level }) => {
  it.each(['image', 'file'])('does not convert a selected %s', type => {
    const stub = createEditorStub()
    stub.isActive.mockImplementation(name => name === type)
    expect(block.apply(stub.editor)).toBe(false)
    expect(stub.chain).not.toHaveBeenCalled()
  })
  it.each([true, false])('dispatches the command and returns %s from run', (result) => {
    const stub = createEditorStub(result)

    expect(block.apply(stub.editor)).toBe(result)
    expect(stub.chain).toHaveBeenCalledExactlyOnceWith()
    expect(stub.focus).toHaveBeenCalledExactlyOnceWith()
    expect(stub.run).toHaveBeenCalledExactlyOnceWith()
    const command = level === undefined ? stub.setParagraph : stub.setHeading
    if (level === undefined) {
      expect(stub.setParagraph).toHaveBeenCalledExactlyOnceWith()
      expect(stub.setHeading).not.toHaveBeenCalled()
    } else {
      expect(stub.setHeading).toHaveBeenCalledExactlyOnceWith({ level })
      expect(stub.setParagraph).not.toHaveBeenCalled()
    }
    expect(stub.chain.mock.invocationCallOrder[0]).toBeLessThan(stub.focus.mock.invocationCallOrder[0])
    expect(stub.focus.mock.invocationCallOrder[0]).toBeLessThan(command.mock.invocationCallOrder[0])
    expect(command.mock.invocationCallOrder[0]).toBeLessThan(stub.run.mock.invocationCallOrder[0])
  })

  it.each([true, false])('forwards the active query and returns %s', (active) => {
    const stub = createEditorStub()
    stub.isActive.mockReturnValue(active)

    expect(block.isActive(stub.editor)).toBe(active)
    if (level === undefined) {
      expect(stub.isActive).toHaveBeenCalledExactlyOnceWith('paragraph')
    } else {
      expect(stub.isActive).toHaveBeenCalledExactlyOnceWith('heading', { level })
    }
  })
})

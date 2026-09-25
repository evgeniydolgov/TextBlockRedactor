import { describe, expect, it } from 'vitest'
import { createEditorStub } from '../testing/editorStub'
import { getActiveBlock } from './getActiveBlock'

describe('getActiveBlock', () => {
  it.each([null, undefined])('falls back when the editor is %s', (editor) => {
    expect(getActiveBlock(editor)).toBe('paragraph')
  })

  it('falls back when no supported block is active', () => {
    const { editor } = createEditorStub()
    expect(getActiveBlock(editor)).toBe('paragraph')
  })

  it.each([
    { name: 'paragraph', level: undefined, expected: 'paragraph' },
    { name: 'heading', level: 1, expected: 'h1' },
    { name: 'heading', level: 2, expected: 'h2' },
    { name: 'heading', level: 3, expected: 'h3' },
    { name: 'image', level: undefined, expected: 'image' },
    { name: 'file', level: undefined, expected: 'file' },
  ])('selects $expected', ({ name, level, expected }) => {
    const { editor, isActive } = createEditorStub()
    isActive.mockImplementation((node, attrs) => node === name && attrs?.level === level)
    expect(getActiveBlock(editor)).toBe(expected)
  })

  it('prefers paragraph when every block matches', () => {
    const { editor, isActive } = createEditorStub()
    isActive.mockReturnValue(true)
    expect(getActiveBlock(editor)).toBe('paragraph')
    expect(isActive).toHaveBeenCalledTimes(1)
  })

  it('prefers the first matching heading', () => {
    const { editor, isActive } = createEditorStub()
    isActive.mockImplementation((name) => name === 'heading')
    expect(getActiveBlock(editor)).toBe('h1')
  })
})

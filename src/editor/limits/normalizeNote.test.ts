import { describe, expect, it, vi } from 'vitest'
import { validate, version } from 'uuid'
import { heading, paragraph } from '../testing/noteFixtures'
import { blockText } from './textBudget'
import { normalizeNote } from './normalizeNote'
import { createEditorOptions } from '../model/editorOptions'
import { prepareInitialDocument } from '../../pages/document/prepareInitialDocument'
import { createRequestPreview } from '../../blocks/requests/createRequestPreview'

describe('normalizeNote', () => {
  it.each([1, 2, 3] as const)('keeps H%s and ID, creates paragraph continuations', level => {
    const input = [heading(level, 'original', 'abcdefg'), paragraph('next', 'x')]
    const before = structuredClone(input)
    const result = normalizeNote(input, { maxBlockCharacters: 3 })
    expect(result.map(blockText)).toEqual(['abc', 'def', 'g', 'x'])
    expect(result[0]).toMatchObject({ id: 'original', type: 'heading', props: { level } })
    for (const block of result.slice(1, 3)) {
      expect(block.type).toBe('paragraph')
      expect(validate(block.id) && version(block.id) === 7).toBe(true)
    }
    expect(result[3].id).toBe('next')
    expect(input).toEqual(before)
    expect(normalizeNote(result, { maxBlockCharacters: 3 })).toBe(result)
  })

  it('applies all budgets without assigning discarded IDs', () => {
    const ids = vi.fn().mockReturnValueOnce('a').mockReturnValueOnce('b').mockReturnValueOnce('new')
    const input = [paragraph('a', 'abcdefgh'), paragraph('b', 'tail')]
    const result = normalizeNote(input, { maxBlockCharacters: 3, maxNoteCharacters: 5, maxBlocks: 2 }, ids)
    expect(result.map(blockText)).toEqual(['abc', 'de'])
    expect(result.map(block => block.id)).toEqual(['a', 'new'])
    expect(ids).toHaveBeenCalledTimes(3)
    const unused = vi.fn()
    expect(normalizeNote(input, { maxBlocks: 1, maxBlockCharacters: 3 }, unused).map(blockText)).toEqual(['abc'])
    expect(unused).not.toHaveBeenCalled()
  })

  it('handles empty input, empty blocks and exact limits', () => {
    expect(normalizeNote([], {}, () => 'empty')).toEqual([paragraph('empty')])
    expect(normalizeNote([paragraph('a'), paragraph('b'), paragraph('c')], { maxBlocks: 2 }))
      .toEqual([paragraph('a'), paragraph('b')])
    expect(normalizeNote([paragraph('a', 'abc'), paragraph('b')], { maxNoteCharacters: 3 }))
      .toEqual([paragraph('a', 'abc')])
    const id = vi.fn()
    expect(normalizeNote([paragraph('a', 'abc')], { maxBlockCharacters: 3 }, id)).toHaveLength(1)
    expect(id).not.toHaveBeenCalled()
  })

  it('never splits a surrogate pair or loops when no character fits', () => {
    const input = [paragraph('a', 'ab😀x')]
    expect(normalizeNote(input, { maxBlockCharacters: 3 }).map(blockText)).toEqual(['ab', '😀x'])
    expect(normalizeNote(input, { maxNoteCharacters: 3 }).map(blockText)).toEqual(['ab'])
    expect(normalizeNote([paragraph('a', '😀x')], { maxBlockCharacters: 1 })).toEqual([paragraph('a')])
  })

  it('shares the normalized initial IDs with editor and preview without mount operations', () => {
    const limits = { maxBlockCharacters: 3, maxBlocks: 2 }
    const initial = prepareInitialDocument([paragraph('old', 'abcdefgh')], limits)
    const onChange = vi.fn()
    const options = createEditorOptions({ initialContent: initial, ...limits, onChange })
    expect(options.content.content?.map(node => node.attrs?.id)).toEqual(initial.map(block => block.id))
    expect(createRequestPreview(initial)(initial)).toEqual([])
    expect(onChange).not.toHaveBeenCalled()
    expect(initial.map(blockText)).toEqual(['abc', 'def'])
  })
})

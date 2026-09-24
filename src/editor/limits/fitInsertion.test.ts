import { describe, expect, it } from 'vitest'
import { fitInsertion, textEnds } from './fitInsertion'
import { fitsContent } from './textBudget'
import { resolveLimits } from './limits'

const limits = resolveLimits({ maxBlockCharacters: 4, maxNoteCharacters: 8, maxBlocks: 3 })

function insert(text: string, from: number, to: number, incoming: string) {
  return fitInsertion(textEnds(incoming), end => text.slice(0, from) + incoming.slice(0, end) + text.slice(to),
    candidate => fitsContent([candidate], limits))
}

describe('fitInsertion', () => {
  it.each([
    [0, 'AB123456'], [3, '123AB456'], [6, '123456AB'],
  ])('preserves the unselected suffix at position %s', (position, result) => {
    expect(insert('123456', position as number, position as number, 'ABCD')).toBe(result)
  })

  it('uses the budget released by the selection', () => {
    expect(insert('12345678', 2, 5, 'ABCDE')).toBe('12ABC678')
    expect(insert('12345678', 2, 2, 'ABC')).toBeUndefined()
    expect(insert('12345678', 2, 5, '')).toBeUndefined()
  })

  it('accepts only complete UTF-16 characters', () => {
    expect(textEnds('a😀e\u0301')).toEqual([1, 3, 4, 5])
    expect(insert('1234567', 3, 3, '😀x')).toBeUndefined()
    expect(insert('123456', 3, 3, '😀x')).toBe('123😀456')
  })

  it('reserves overflow slots and never consumes the existing next block', () => {
    const constrained = resolveLimits({ maxBlockCharacters: 3, maxBlocks: 2 })
    const result = fitInsertion(textEnds('XYZ'), end => ['ab' + 'XYZ'.slice(0, end), 'old'],
      candidate => fitsContent(candidate, constrained))
    expect(result).toEqual(['abX', 'old'])
  })

  it('accepts a partial group of blocks in order', () => {
    const incoming = ['AB', 'CD', 'EF']
    const result = fitInsertion([1, 2, 3, 4, 5, 6], end => {
      const parts = incoming.slice(0, Math.ceil(end / 2))
      parts[parts.length - 1] = parts.at(-1)!.slice(0, end % 2 || 2)
      return ['old', ...parts, 'tail']
    }, candidate => fitsContent(candidate, resolveLimits({ maxBlocks: 4, maxNoteCharacters: 10 })))
    expect(result).toEqual(['old', 'AB', 'C', 'tail'])
  })
})

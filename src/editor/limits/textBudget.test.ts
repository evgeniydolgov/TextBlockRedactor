import { describe, expect, it } from 'vitest'
import { heading, paragraph } from '../testing/noteFixtures'
import { defaultContentLimits, resolveLimits } from './limits'
import { blockText, fitsContent, planContent, safeEnd, splitEnds } from './textBudget'
import { createAttachment } from '../model/noteBlock'

describe('content budgets', () => {
  it('counts attachment slots without consuming characters', () => {
    expect(blockText(createAttachment('image', 'i'))).toBe('')
    expect(blockText(createAttachment('file', 'f'))).toBe('')
    expect(planContent(['abc', '', ''], resolveLimits({ maxNoteCharacters: 3 }), [false, true, true]))
      .toEqual([{ index: 0, start: 0, end: 3 }, { index: 1, start: 0, end: 0 }, { index: 2, start: 0, end: 0 }])
  })
  it('uses independent defaults and overrides', () => {
    expect(resolveLimits()).toEqual(defaultContentLimits)
    expect(resolveLimits({ maxBlocks: 2 })).toEqual({ ...defaultContentLimits, maxBlocks: 2 })
  })

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('replaces invalid %s only', value => {
    expect(resolveLimits({ maxBlocks: value, maxNoteCharacters: 7, maxBlockCharacters: value }))
      .toEqual({ maxBlocks: 100, maxNoteCharacters: 7, maxBlockCharacters: 8000 })
  })

  it('counts text fragments, whitespace and UTF-16, ignoring metadata', () => {
    const block = heading(3, 'long-id-is-not-text', 'a ')
    block.content.push({ type: 'text', text: '😀e\u0301', styles: {} })
    expect(blockText(block)).toBe('a 😀e\u0301')
    expect(blockText(block).length).toBe(6)
    expect(blockText(paragraph())).toBe('')
  })

  it.each([7999, 8000, 8001])('plans block length %s', length => {
    expect(splitEnds('a'.repeat(length), 8000)).toEqual(length <= 8000 ? [length] : [8000, length])
  })

  it.each([49999, 50000, 50001])('checks total %s', length => {
    expect(fitsContent(['a'.repeat(length)], resolveLimits())).toBe(length <= 50000)
  })

  it.each([99, 100, 101])('counts empty blocks: %s', count => {
    expect(fitsContent(Array<string>(count).fill(''), resolveLimits())).toBe(count <= 100)
  })

  it('reserves slots for overflow and preserves surrogate pairs', () => {
    expect(splitEnds('ab😀c', 3)).toEqual([2, 5])
    expect(safeEnd('😀', 1)).toBe(0)
    expect(splitEnds('😀x', 1)).toEqual([])
    expect(fitsContent(['😀'], resolveLimits({ maxBlockCharacters: 1 }))).toBe(false)
    expect(fitsContent(['abcd', ''], resolveLimits({ maxBlockCharacters: 3, maxBlocks: 2 }))).toBe(false)
    expect(fitsContent(['abc', ''], resolveLimits({ maxNoteCharacters: 3 }))).toBe(true)
  })

  it('stops at the first unavailable character and trims the suffix', () => {
    expect(planContent(['a😀x', 'z'], resolveLimits({ maxBlockCharacters: 1 })))
      .toEqual([{ index: 0, start: 0, end: 1 }])
    expect(planContent(['😀x'], resolveLimits({ maxBlockCharacters: 1 })))
      .toEqual([{ index: 0, start: 0, end: 0 }])
    expect(planContent(['ab😀', 'z'], resolveLimits({ maxNoteCharacters: 3 })))
      .toEqual([{ index: 0, start: 0, end: 2 }])
  })
})

import { afterEach, expect, it, vi } from 'vitest'
import { paragraph } from '../../../editor/testing/noteFixtures'
import { logNoteBlocks } from '../logNoteBlocks'

afterEach(() => vi.restoreAllMocks())

it('logs a readable immutable JSON snapshot with a searchable label', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const note = [paragraph('a', 'Привет')]
  logNoteBlocks(note)
  expect(log).toHaveBeenCalledExactlyOnceWith('[note:blocks]', JSON.stringify(note, null, 2))
  const output = log.mock.calls[0][1] as string
  expect(JSON.parse(output)).toEqual(note)
  expect(output).toContain('\n  {')
  note[0].content[0].text = 'Изменено'
  expect(JSON.parse(output)[0].content[0].text).toBe('Привет')
})

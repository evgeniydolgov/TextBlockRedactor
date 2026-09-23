import { describe, expect, it } from 'vitest'
import { heading, mixedNote, paragraph } from '../testing/noteFixtures'
import { validateNote } from './validateNote'

describe('validateNote', () => {
  it.each([{ note: [] }, { note: mixedNote() }])('accepts supported documents', ({ note }) => {
    expect(() => validateNote(note)).not.toThrow()
  })

  it.each([
    [null, 'initialContent'], [{ type: 'doc', content: [] }, 'initialContent'],
    [[null], 'blocks[0]'], [[[]], 'blocks[0]'],
    [[{ ...paragraph(), id: '' }], 'blocks[0].id'],
    [[{ ...paragraph(), id: undefined }], 'blocks[0].id'],
    [[{ ...paragraph(), id: 1 }], 'blocks[0].id'],
    [[paragraph(), paragraph()], 'blocks[1].id'],
    [[{ ...paragraph(), type: 'image' }], 'blocks[0].type'],
    [[{ ...paragraph(), attrs: {} }], 'blocks[0].attrs'],
    [[{ ...paragraph(), props: null }], 'blocks[0].props'],
    [[{ ...paragraph(), props: {} }], 'blocks[0].props.backgroundColor'],
    [[{ ...paragraph(), children: [paragraph()] }], 'blocks[0].children'],
    [[{ ...paragraph(), children: undefined }], 'blocks[0].children'],
    [[{ ...paragraph(), content: 'text' }], 'blocks[0].content'],
    [[{ ...paragraph(), content: [null] }], 'blocks[0].content[0]'],
    [[{ ...paragraph(), content: [{ type: 'link' }] }], 'content[0].type'],
    [[{ ...paragraph(), content: [{ type: 'text', text: 2 }] }], 'content[0].text'],
    [[{ ...paragraph(), content: [{ type: 'text', text: '', styles: [] }] }], 'content[0].styles'],
    [[{ ...paragraph(), content: [{ type: 'text', text: 'x', styles: { bold: true } }] }], 'styles'],
  ])('rejects invalid input with a field path', (note, path) => {
    expect(() => validateNote(note)).toThrow(path as string)
  })

  it.each([
    ['backgroundColor', 'red'], ['textColor', 'blue'], ['textAlignment', 'center'],
    ['level', 4], ['level', '1'], ['isToggleable', true], ['unknown', true],
  ])('rejects unsupported heading prop %s', (key, value) => {
    const block = heading(1)
    expect(() => validateNote([{ ...block, props: { ...block.props, [key]: value } }]))
      .toThrow(`blocks[0].props.${key}`)
  })
})

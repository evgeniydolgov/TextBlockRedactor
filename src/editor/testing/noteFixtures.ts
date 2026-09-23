import type { NoteBlock, NoteDocument, HeadingLevel } from '../model/noteBlock'

export function paragraph(id = 'p1', text = ''): NoteBlock {
  return {
    id, type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: text ? [{ type: 'text', text, styles: {} }] : [], children: [],
  }
}

export function heading(level: HeadingLevel, id = `h${level}`, text = ''): NoteBlock {
  return {
    ...paragraph(id, text), type: 'heading',
    props: {
      backgroundColor: 'default', textColor: 'default', textAlignment: 'left',
      level, isToggleable: false,
    },
  }
}

export function mixedNote(): NoteDocument {
  return [paragraph('p1', '  Привет 🌍 '), heading(1, 'h1', 'Один'),
    heading(2, 'h2', 'Два'), heading(3), paragraph('empty')]
}

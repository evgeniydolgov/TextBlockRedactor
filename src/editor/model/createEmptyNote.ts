import { defaultBlockProps } from './noteBlock'
import type { NoteDocument } from './noteBlock'

export function createEmptyNote(generateId: () => string = () => crypto.randomUUID()): NoteDocument {
  return [{
    id: generateId(),
    type: 'paragraph',
    props: { ...defaultBlockProps },
    content: [],
    children: [],
  }]
}

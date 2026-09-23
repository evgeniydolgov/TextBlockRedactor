import { defaultBlockProps } from './noteBlock'
import type { NoteDocument } from './noteBlock'
import { createId } from '../../shared/ids'

export function createEmptyNote(generateId: () => string = createId): NoteDocument {
  return [{
    id: generateId(),
    type: 'paragraph',
    props: { ...defaultBlockProps },
    content: [],
    children: [],
  }]
}

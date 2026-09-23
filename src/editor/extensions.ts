import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import UniqueID from '@tiptap/extension-unique-id'
import { NoteHeading } from './identity/NoteHeading'
import { BlockIdentity } from './identity/BlockIdentity'
import { UndoRedo } from '@tiptap/extensions'
import { headingLevels } from './blocks/headings'

export const editorExtensions = [
  Document,
  Paragraph,
  Text,
  NoteHeading.configure({ levels: [...headingLevels] }),
  UniqueID.configure({ types: ['paragraph', 'heading'], attributeName: 'id' }),
  BlockIdentity,
  UndoRedo,
]

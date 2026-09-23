import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import { UndoRedo } from '@tiptap/extensions'

export const editorExtensions = [
  Document, Paragraph, Text,
  Heading.configure({ levels: [1, 2, 3] }),
  UndoRedo,
]

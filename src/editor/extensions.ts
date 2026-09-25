import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import UniqueID from '@tiptap/extension-unique-id'
import { NoteHeading } from './identity/NoteHeading'
import { BlockIdentity } from './identity/BlockIdentity'
import { uniqueIdOptions } from './identity/uniqueIdOptions'
import { UndoRedo } from '@tiptap/extensions'
import { headingLevels } from './blocks/headings'
import { ContentLimitsExtension } from './limits/ContentLimits'
import type { LimitController } from './limits/limitController'
import { AttachmentKeyboard, ImagePlaceholder, FilePlaceholder } from './blocks/AttachmentNode'

export const editorExtensions = [
  Document,
  Paragraph,
  Text,
  ImagePlaceholder,
  FilePlaceholder,
  AttachmentKeyboard,
  NoteHeading.configure({ levels: [...headingLevels] }),
  UniqueID.configure(uniqueIdOptions),
  BlockIdentity,
  UndoRedo,
]

export const createEditorExtensions = (controller: LimitController) => [
  ...editorExtensions,
  ContentLimitsExtension.configure({ controller }),
]

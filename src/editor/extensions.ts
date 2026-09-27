import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import UniqueID from '@tiptap/extension-unique-id'
import { NoteHeading } from './identity/NoteHeading'
import { BlockIdentity } from './identity/BlockIdentity'
import { uniqueIdOptions } from './identity/uniqueIdOptions'
import { UndoRedo } from '@tiptap/extensions'
import { headingLevels } from './blocks/headings'
import { ContentLimitsExtension } from './limits/tiptap/ContentLimits'
import type { LimitController } from './limits/tiptap/limitController'
import { AttachmentKeyboard } from './blocks/attachments/AttachmentKeyboard'
import { ImagePlaceholder } from './blocks/attachments/ImageNode'
import { FilePlaceholder } from './blocks/attachments/FileNode'
import type { ImageStorageController } from './images/imageStorage'

const baseEditorExtensions = [
  Document,
  Paragraph,
  Text,
  FilePlaceholder,
  AttachmentKeyboard,
  NoteHeading.configure({ levels: [...headingLevels] }),
  UniqueID.configure(uniqueIdOptions),
  BlockIdentity,
  UndoRedo,
]

export const createEditorExtensions = (
  controller: LimitController,
  imageStorage: ImageStorageController,
) => [
  ...baseEditorExtensions.slice(0, 3),
  ImagePlaceholder.configure({ storage: imageStorage }),
  ...baseEditorExtensions.slice(3),
  ContentLimitsExtension.configure({ controller }),
]

import { Node, mergeAttributes } from '@tiptap/core'
import { createFileStorageController, type FileStorageController } from '../../files/fileStorage'
import { createFileNodeView } from './fileNodeView'

type FileNodeOptions = { storage: FileStorageController }

export const FilePlaceholder = Node.create<FileNodeOptions>({
  name: 'file',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addOptions: () => ({ storage: createFileStorageController() }),
  addAttributes: () => ({
    url: { default: '', rendered: false },
    name: { default: '', rendered: false },
    caption: { default: '', rendered: false },
  }),
  parseHTML: () => [{ tag: 'div[data-attachment="file"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, {
    'data-attachment': 'file', class: 'attachment-placeholder file-block',
  }), ['button', { type: 'button' }, 'Выбрать файл']],
  addNodeView() {
    return createFileNodeView(this.options.storage)
  },
})

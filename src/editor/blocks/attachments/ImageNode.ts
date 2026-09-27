import { Node, mergeAttributes } from '@tiptap/core'
import { createImageStorageController, type ImageStorageController } from '../../images/imageStorage'
import { createImageNodeView } from './imageNodeView'

type ImageNodeOptions = {
  storage: ImageStorageController
}

export const ImagePlaceholder = Node.create<ImageNodeOptions>({
  name: 'image',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addOptions: () => ({ storage: createImageStorageController() }),
  addAttributes: () => ({
    url: { default: '', rendered: false },
    name: { default: '', rendered: false },
    caption: { default: '', rendered: false },
  }),
  parseHTML: () => [{ tag: 'div[data-attachment="image"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, {
    'data-attachment': 'image', class: 'attachment-placeholder image-block',
  }), ['button', { type: 'button' }, 'Выбрать изображение']],
  addNodeView() {
    return createImageNodeView(this.options.storage)
  },
})

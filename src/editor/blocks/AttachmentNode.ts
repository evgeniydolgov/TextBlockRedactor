import { Extension, Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import type { AttachmentType } from '../model/noteBlock'
import { deleteSelectedAttachment } from './attachmentCommands'

function attachmentNode(type: AttachmentType, label: string) {
  return Node.create({
    name: type,
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,
    parseHTML: () => [{ tag: `div[data-attachment="${type}"]` }],
    renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, {
      'data-attachment': type, class: 'attachment-placeholder',
    }), ['button', { type: 'button', disabled: 'disabled' }, label]],
    addNodeView() {
      return ({ editor, node, getPos }) => {
        const dom = document.createElement('div')
        dom.className = 'attachment-placeholder'
        dom.dataset.attachment = type
        dom.dataset.id = node.attrs.id
        dom.contentEditable = 'false'
        dom.tabIndex = 0
        dom.setAttribute('role', 'group')
        dom.setAttribute('aria-label', type === 'image' ? 'Пустой блок изображения' : 'Пустой блок файла')
        const button = document.createElement('button')
        button.type = 'button'
        button.disabled = true
        button.textContent = label
        dom.append(button)
        const select = () => {
          const pos = getPos()
          if (typeof pos === 'number') {
            editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
          }
        }
        dom.addEventListener('focus', select)
        dom.addEventListener('click', () => { select(); editor.view.focus() })
        return {
          dom,
          selectNode: () => dom.classList.add('ProseMirror-selectednode'),
          deselectNode: () => dom.classList.remove('ProseMirror-selectednode'),
          ignoreMutation: () => true,
        }
      }
    },
  })
}

export const ImagePlaceholder = attachmentNode('image', 'Выбрать изображение')
export const FilePlaceholder = attachmentNode('file', 'Выбрать файл')

// Keep paragraph first in the schema while handling Backspace before base keymaps.
export const AttachmentKeyboard = Extension.create({
  name: 'attachmentKeyboard',
  priority: 1100,
  addKeyboardShortcuts() {
    return { Backspace: () => deleteSelectedAttachment(this.editor) }
  },
})

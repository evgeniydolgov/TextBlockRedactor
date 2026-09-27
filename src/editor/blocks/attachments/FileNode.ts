import { Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'

export const FilePlaceholder = Node.create({
  name: 'file',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  parseHTML: () => [{ tag: 'div[data-attachment="file"]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, {
    'data-attachment': 'file', class: 'attachment-placeholder',
  }), ['button', { type: 'button', disabled: 'disabled' }, 'Выбрать файл']],
  addNodeView() {
    return ({ editor, node, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'attachment-placeholder'
      dom.dataset.attachment = 'file'
      dom.dataset.id = node.attrs.id
      dom.contentEditable = 'false'
      dom.tabIndex = 0
      dom.setAttribute('role', 'group')
      dom.setAttribute('aria-label', 'Пустой блок файла')
      const button = document.createElement('button')
      button.type = 'button'
      button.disabled = true
      button.textContent = 'Выбрать файл'
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

import { Extension, Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { deleteSelectedAttachment, updateImageAttachment } from './attachmentCommands'
import { createImageUpload, type ImageUploadState } from '../images/imageUpload'
import { createImageResolution, type ImageResolutionState } from '../images/imageResolution'
import { createImageStorageController, type ImageStorageController } from '../images/imageStorage'

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
    const storage = this.options.storage
    return ({ editor, node, getPos }) => {
      let currentNode = node
      let uploadState: ImageUploadState = 'idle'
      let resolutionState: ImageResolutionState = { type: 'idle' }

      const dom = document.createElement('div')
      dom.className = 'attachment-placeholder image-block'
      dom.dataset.attachment = 'image'
      dom.dataset.id = node.attrs.id
      dom.contentEditable = 'false'
      dom.tabIndex = 0
      dom.setAttribute('role', 'group')
      dom.setAttribute('aria-label', 'Блок изображения')

      const image = document.createElement('img')
      image.className = 'image-block__preview'
      const status = document.createElement('p')
      status.className = 'image-block__status'
      status.setAttribute('role', 'status')
      const chooseButton = document.createElement('button')
      chooseButton.type = 'button'
      chooseButton.textContent = 'Выбрать изображение'
      const retryButton = document.createElement('button')
      retryButton.type = 'button'
      retryButton.textContent = 'Повторить получение изображения'
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.hidden = true
      dom.append(image, status, chooseButton, retryButton, input)

      function render() {
        const hasFile = Boolean(currentNode.attrs.url)
        image.hidden = true
        image.removeAttribute('src')
        image.alt = currentNode.attrs.name || 'Изображение'
        chooseButton.hidden = hasFile
        chooseButton.disabled = !storage.get() || uploadState === 'loading'
        chooseButton.textContent = uploadState === 'loading' ? 'Загрузка…' : 'Выбрать изображение'
        retryButton.hidden = true
        retryButton.disabled = !storage.get()
        status.hidden = true

        if (!hasFile) {
          if (uploadState === 'error') {
            status.hidden = false
            status.textContent = 'Не удалось загрузить изображение. Попробуйте ещё раз.'
          }
          return
        }
        if (resolutionState.type === 'ready') {
          image.src = resolutionState.src
          image.hidden = false
          return
        }
        status.hidden = false
        if (resolutionState.type === 'loading') status.textContent = 'Загрузка изображения…'
        else if (resolutionState.type === 'unavailable') status.textContent = 'Хранилище изображений недоступно.'
        else if (resolutionState.type === 'error') {
          status.textContent = 'Не удалось получить изображение.'
          retryButton.hidden = false
        } else status.textContent = 'Изображение пока недоступно.'
      }

      const upload = createImageUpload({
        getAdapter: storage.get,
        onUploaded: uploaded => {
          const pos = getPos()
          if (typeof pos === 'number') updateImageAttachment(editor, pos, uploaded)
        },
        onStateChange: state => { uploadState = state; render() },
      })
      const resolution = createImageResolution({
        getAdapter: storage.get,
        onStateChange: state => { resolutionState = state; render() },
      })
      const select = () => {
        const pos = getPos()
        if (typeof pos === 'number') {
          editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
        }
      }
      const unsubscribe = storage.subscribe(() => {
        render()
        if (currentNode.attrs.url) void resolution.resolve(currentNode.attrs.url)
      })

      dom.addEventListener('focus', select)
      dom.addEventListener('click', () => { select(); editor.view.focus() })
      chooseButton.addEventListener('click', event => {
        event.stopPropagation()
        select()
        if (storage.get() && uploadState !== 'loading') input.click()
      })
      retryButton.addEventListener('click', event => {
        event.stopPropagation()
        select()
        void resolution.retry()
      })
      input.addEventListener('change', () => {
        const file = input.files?.[0]
        input.value = ''
        if (file) void upload.upload(file)
      })

      render()
      if (currentNode.attrs.url) void resolution.resolve(currentNode.attrs.url)

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'image') return false
          const previousUrl = currentNode.attrs.url
          currentNode = updatedNode
          dom.dataset.id = updatedNode.attrs.id
          render()
          if (updatedNode.attrs.url !== previousUrl) void resolution.resolve(updatedNode.attrs.url)
          return true
        },
        selectNode: () => dom.classList.add('ProseMirror-selectednode'),
        deselectNode: () => dom.classList.remove('ProseMirror-selectednode'),
        ignoreMutation: () => true,
        destroy() {
          unsubscribe()
          upload.destroy()
          resolution.destroy()
        },
      }
    }
  },
})

// Keep paragraph first in the schema while handling Backspace before base keymaps.
export const AttachmentKeyboard = Extension.create({
  name: 'attachmentKeyboard',
  priority: 1100,
  addKeyboardShortcuts() {
    return { Backspace: () => deleteSelectedAttachment(this.editor) }
  },
})

import type { NodeViewRenderer } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { updateImageAttachment } from './attachmentCommands'
import { createImageUpload, type ImageUploadState } from '../../images/imageUpload'
import { createImageResolution, type ImageResolutionState } from '../../images/imageResolution'
import type { ImageStorageController } from '../../images/imageStorage'
import { createImageViewElements } from './imageViewElements'

export function createImageNodeView(storage: ImageStorageController): NodeViewRenderer {
  return ({ editor, node, getPos }) => {
    let currentNode = node
    const blockId: string = node.attrs.id
    let uploadState: ImageUploadState = 'idle'
    let resolutionState: ImageResolutionState = { type: 'idle' }
    const { dom, chooseButton, retryButton, input, render: renderElements } = createImageViewElements(node.attrs.id)
    const render = () => renderElements(currentNode.attrs.url, currentNode.attrs.name, storage, uploadState, resolutionState)

    const upload = createImageUpload({
      getAdapter: storage.get,
      onUploaded: uploaded => {
        const pos = getPos()
        if (typeof pos === 'number') updateImageAttachment(editor, pos, blockId, uploaded)
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
        if (updatedNode.type.name !== 'image' || updatedNode.attrs.id !== blockId) return false
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
}

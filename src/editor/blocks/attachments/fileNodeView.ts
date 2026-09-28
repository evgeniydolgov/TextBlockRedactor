import type { NodeViewRenderer } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { updateFileAttachment } from './attachmentCommands'
import { createFileUpload, type FileUploadState } from '../../files/fileUpload'
import { createFileDownload, type FileDownloadState } from '../../files/fileDownload'
import type { FileStorageController } from '../../files/fileStorage'
import { createFileViewElements } from './fileViewElements'

function startBrowserDownload(url: string, name: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
}

export function createFileNodeView(storage: FileStorageController): NodeViewRenderer {
  return ({ editor, node, getPos }) => {
    let currentNode = node
    const blockId = node.attrs.id
    let uploadState: FileUploadState = 'idle'
    let downloadState: FileDownloadState = 'idle'
    const { dom, chooseButton, downloadButton, input, render: renderElements } = createFileViewElements(blockId)
    const render = () => renderElements(currentNode.attrs.url, currentNode.attrs.name,
      storage, uploadState, downloadState)
    const upload = createFileUpload({
      getAdapter: storage.get,
      onUploaded: uploaded => {
        const pos = getPos()
        if (typeof pos === 'number') updateFileAttachment(editor, pos, blockId, uploaded)
      },
      onStateChange: state => { uploadState = state; render() },
    })
    const download = createFileDownload({
      getAdapter: storage.get,
      onStateChange: state => { downloadState = state; render() },
      startDownload: startBrowserDownload,
    })
    const select = () => {
      const pos = getPos()
      if (typeof pos === 'number' && editor.state.doc.nodeAt(pos)?.attrs.id === blockId) {
        editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, pos)))
      }
    }
    const unsubscribe = storage.subscribe(render)

    dom.addEventListener('focus', select)
    dom.addEventListener('click', () => { select(); editor.view.focus() })
    chooseButton.addEventListener('click', event => {
      event.stopPropagation()
      select()
      if (storage.get() && uploadState !== 'loading') input.click()
    })
    downloadButton.addEventListener('click', event => {
      event.stopPropagation()
      select()
      if (currentNode.attrs.url) void download.download(currentNode.attrs.url, currentNode.attrs.name)
    })
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      input.value = ''
      if (file) void upload.upload(file)
    })

    render()
    return {
      dom,
      update(updatedNode) {
        if (updatedNode.type.name !== 'file' || updatedNode.attrs.id !== blockId) return false
        if (updatedNode.attrs.url !== currentNode.attrs.url) download.invalidate()
        currentNode = updatedNode
        render()
        return true
      },
      selectNode: () => dom.classList.add('ProseMirror-selectednode'),
      deselectNode: () => dom.classList.remove('ProseMirror-selectednode'),
      ignoreMutation: () => true,
      destroy() {
        unsubscribe()
        upload.destroy()
        download.destroy()
      },
    }
  }
}

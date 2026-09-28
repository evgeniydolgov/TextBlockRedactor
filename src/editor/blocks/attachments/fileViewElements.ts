import type { FileDownloadState } from '../../files/fileDownload'
import type { FileUploadState } from '../../files/fileUpload'
import type { FileStorageController } from '../../files/fileStorage'

export function createFileViewElements(id: string) {
  const dom = document.createElement('div')
  dom.className = 'attachment-placeholder file-block'
  dom.dataset.attachment = 'file'
  dom.dataset.id = id
  dom.contentEditable = 'false'
  dom.tabIndex = 0
  dom.setAttribute('role', 'group')
  dom.setAttribute('aria-label', 'Блок файла')

  const nameElement = document.createElement('span')
  nameElement.className = 'file-block__name'
  const status = document.createElement('p')
  status.className = 'file-block__status'
  status.setAttribute('role', 'status')
  const chooseButton = document.createElement('button')
  chooseButton.type = 'button'
  chooseButton.textContent = 'Выбрать файл'
  const downloadButton = document.createElement('button')
  downloadButton.type = 'button'
  downloadButton.textContent = 'Скачать'
  const input = document.createElement('input')
  input.type = 'file'
  input.hidden = true
  dom.append(nameElement, status, chooseButton, downloadButton, input)

  function render(url: string, name: string, storage: FileStorageController,
    uploadState: FileUploadState, downloadState: FileDownloadState) {
    const hasFile = Boolean(url)
    nameElement.hidden = !hasFile
    nameElement.textContent = hasFile ? name : ''
    chooseButton.hidden = hasFile
    chooseButton.disabled = !storage.get() || uploadState === 'loading'
    chooseButton.textContent = uploadState === 'loading' ? 'Загрузка…' : 'Выбрать файл'
    downloadButton.hidden = !hasFile
    downloadButton.disabled = !storage.get() || downloadState === 'loading'
    downloadButton.textContent = downloadState === 'loading' ? 'Скачивание…' : 'Скачать'
    status.hidden = true
    status.textContent = ''
    if (!hasFile && uploadState === 'error') {
      status.hidden = false
      status.textContent = 'Не удалось загрузить файл. Выберите его ещё раз.'
    } else if (hasFile && downloadState === 'error') {
      status.hidden = false
      status.textContent = 'Не удалось скачать файл. Попробуйте ещё раз.'
    }
  }

  return { dom, chooseButton, downloadButton, input, render }
}

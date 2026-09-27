import type { ImageResolutionState } from '../../images/imageResolution'
import type { ImageUploadState } from '../../images/imageUpload'
import type { ImageStorageController } from '../../images/imageStorage'

export function createImageViewElements(id: string) {
  const dom = document.createElement('div')
  dom.className = 'attachment-placeholder image-block'
  dom.dataset.attachment = 'image'
  dom.dataset.id = id
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

  function render(
    url: string,
    name: string,
    storage: ImageStorageController,
    uploadState: ImageUploadState,
    resolutionState: ImageResolutionState,
  ) {
    const hasFile = Boolean(url)
    image.hidden = true
    image.removeAttribute('src')
    image.alt = name || 'Изображение'
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

  return { dom, chooseButton, retryButton, input, render }
}

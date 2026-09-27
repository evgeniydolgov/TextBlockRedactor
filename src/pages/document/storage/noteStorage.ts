import type { NoteDocument } from '../../../editor/model/note/noteBlock'
import { validateNote } from '../../../editor/model/note/validateNote'

export const NOTE_STORAGE_KEY = 'text-block-redactor:note:v1'
export const LOAD_ERROR = 'Не удалось загрузить заметку. Изменения заменят прежнюю локальную запись.'
export const SAVE_ERROR = 'Не удалось сохранить заметку на этом устройстве.'

type StorageSource = () => Pick<Storage, 'getItem' | 'setItem'>
export type SaveResult = { error: string | null }

export function createNoteStorage(getStorage: StorageSource = () => window.localStorage) {
  function load(): { document: NoteDocument, error: string | null } {
    try {
      const raw = getStorage().getItem(NOTE_STORAGE_KEY)
      const document: unknown = raw === null ? [] : JSON.parse(raw)
      validateNote(document)
      return { document, error: null }
    } catch {
      return { document: [], error: LOAD_ERROR }
    }
  }

  function save(document: NoteDocument): SaveResult {
    try {
      getStorage().setItem(NOTE_STORAGE_KEY, JSON.stringify(document))
      return { error: null }
    } catch {
      return { error: SAVE_ERROR }
    }
  }

  return { load, save }
}

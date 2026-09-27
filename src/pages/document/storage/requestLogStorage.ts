import type { BlockRequest } from '../../../blocks/requests/types'
import type { NoteDocument } from '../../../editor/model/note/noteBlock'

export const REQUEST_LOG_KEY = 'text-block-redactor:request-log:v1'

export type SaveCycle = {
  requests: BlockRequest[]
  storage: { key: string; data: NoteDocument; success: boolean; error: string | null }
}

export function createRequestLogStorage(getStorage: () => Pick<Storage, 'setItem'> = () => window.localStorage) {
  return (cycle: SaveCycle) => {
    try {
      getStorage().setItem(REQUEST_LOG_KEY, JSON.stringify(cycle))
    } catch (error) {
      console.warn('[note:request-log] Не удалось записать последний цикл', error)
    }
  }
}

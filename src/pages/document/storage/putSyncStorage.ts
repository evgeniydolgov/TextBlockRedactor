import type { NoteDocument } from '../../../editor/model/note/noteBlock'
import { validateNote } from '../../../editor/model/note/validateNote'

export const PUT_SYNC_STORAGE_KEY = 'text-block-redactor:put-sync:v1'
export const PUT_SYNC_LOAD_ERROR = 'Не удалось загрузить состояние синхронизации.'
export const PUT_SYNC_SAVE_ERROR = 'Не удалось сохранить подтверждения сервера на этом устройстве.'

type StorageSource = () => Pick<Storage, 'getItem' | 'setItem'>

export type PutSyncRecord = {
  confirmed: NoteDocument | null
  blockedIds: string[]
  error: string | null
}

export function createPutSyncStorage(getStorage: StorageSource = () => window.localStorage) {
  function load(noteId?: string): PutSyncRecord {
    try {
      const raw = getStorage().getItem(PUT_SYNC_STORAGE_KEY)
      if (raw === null) return { confirmed: null, blockedIds: [], error: null }
      const record: unknown = JSON.parse(raw)
      if (record === null || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid record')
      const fields = record as Record<string, unknown>
      if (fields.version !== 1 || fields.noteId !== (noteId ?? null)) {
        return { confirmed: null, blockedIds: [], error: null }
      }
      const confirmed = fields.confirmed
      validateNote(confirmed)
      if (!Array.isArray(fields.blockedIds) ||
        fields.blockedIds.some(id => typeof id !== 'string' || !id.trim()) ||
        new Set(fields.blockedIds).size !== fields.blockedIds.length ||
        fields.blockedIds.some(id => !confirmed.some(block => block.id === id))) {
        throw new Error('Invalid blocked IDs')
      }
      return { confirmed: structuredClone(confirmed), blockedIds: [...fields.blockedIds], error: null }
    } catch {
      return { confirmed: null, blockedIds: [], error: PUT_SYNC_LOAD_ERROR }
    }
  }

  function save(noteId: string | undefined, confirmed: NoteDocument, blockedIds: string[] = []): { error: string | null } {
    try {
      validateNote(confirmed)
      if (new Set(blockedIds).size !== blockedIds.length ||
        blockedIds.some(id => !confirmed.some(block => block.id === id))) {
        throw new Error('Invalid blocked IDs')
      }
      getStorage().setItem(PUT_SYNC_STORAGE_KEY, JSON.stringify({
        version: 1, noteId: noteId ?? null, confirmed, blockedIds,
      }))
      return { error: null }
    } catch {
      return { error: PUT_SYNC_SAVE_ERROR }
    }
  }

  return { load, save }
}

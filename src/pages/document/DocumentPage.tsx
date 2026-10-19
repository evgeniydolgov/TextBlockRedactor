import { useEffect, useRef, useState } from 'react'
import { TextEditor } from '../../editor/TextEditor'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage } from './storage/noteStorage'
import { createRequestLogStorage } from './storage/requestLogStorage'
import { createRequestPreview } from '../../blocks/requests/createRequestPreview'
import { prepareInitialDocument } from './prepareInitialDocument'
import { createMemoryImageStorage } from '../../editor/images/createMemoryImageStorage'
import { createMemoryFileStorage } from '../../editor/files/createMemoryFileStorage'
import { createMemoryPutAdapter } from '../../blocks/sync/createMemoryPutAdapter'
import { createPutQueue, type PutBlock, type PutQueueStatus } from '../../blocks/sync/putQueue'
import type { NoteDocument } from '../../editor/model/note/noteBlock'
import { createPutSyncAutosave } from './createPutSyncAutosave'
import { getPutSyncStatusText } from './putSyncStatus'
import { createPutSyncStorage } from './storage/putSyncStorage'
import './document-page.css'

const NOTE_SAVE_DELAY_MS = 1000
const NOTE_CONTENT_LIMITS = {
  maxBlockCharacters: 8000,
  maxNoteCharacters: 50000,
  maxBlocks: 100,
}
const imageStorage = createMemoryImageStorage()
const fileStorage = createMemoryFileStorage()

type DocumentPageProps = {
  noteId?: string
  putBlock?: PutBlock | null
  confirmedBlocks?: NoteDocument
}

export function DocumentPage({ noteId, putBlock, confirmedBlocks }: DocumentPageProps) {
  const [storage] = useState(() => createNoteStorage())
  const [initialNote] = useState(() => storage.load())
  const [initialDocument] = useState(() => prepareInitialDocument(initialNote.document, NOTE_CONTENT_LIMITS))
  const [syncStorage] = useState(() => createPutSyncStorage())
  const [savedSync] = useState(() => syncStorage.load(noteId))
  const [demo] = useState(() => createMemoryPutAdapter(initialDocument))
  const [error, setError] = useState(initialNote.error)
  const [localSaved, setLocalSaved] = useState(false)
  const [syncError, setSyncError] = useState(savedSync.error)
  const [syncStatus, setSyncStatus] = useState<PutQueueStatus | null>(null)
  const queueRef = useRef<ReturnType<typeof createPutQueue> | null>(null)
  const [saveNote] = useState(() => createNoteSaveHandler(storage.save, setError, {
    preview: createRequestPreview(initialDocument, noteId),
    recordCycle: createRequestLogStorage(),
  }))
  const [onChange] = useState(() => {
    const autosave = createPutSyncAutosave(saveNote, () => queueRef.current)
    return (document: NoteDocument) => {
      const result = autosave(document)
      setLocalSaved(result.error === null)
      return result
    }
  })
  const transport = putBlock === undefined ? demo.putBlock : putBlock
  const confirmed = savedSync.error ? null : savedSync.confirmed ??
    (putBlock === undefined ? initialDocument : confirmedBlocks ?? null)

  useEffect(() => {
    if (!transport || !confirmed) return
    const recovered = syncStorage.load(noteId)
    if (recovered.error) {
      setSyncError(recovered.error)
      return
    }
    const queue = createPutQueue({
      confirmed: recovered.confirmed ?? confirmed,
      blockedIds: recovered.confirmed ? recovered.blockedIds : savedSync.blockedIds,
      putBlock: transport,
      persistState: (nextConfirmed, blockedIds) => {
        const result = syncStorage.save(noteId, nextConfirmed, blockedIds)
        setSyncError(result.error)
        return result.error === null
      },
      onStatus: setSyncStatus,
    })
    queueRef.current = queue
    queue.update(initialDocument)
    return () => {
      queue.destroy()
      queueRef.current = null
    }
  }, [transport, confirmed, savedSync.blockedIds, syncStorage, noteId, initialDocument])

  const syncText = getPutSyncStatusText(syncStatus, {
    initialized: Boolean(transport && confirmed), demo: putBlock === undefined,
    storageError: syncError, localError: error,
  })

  return (
    <main className="document-page">
      <header>
        <p className="eyebrow">МОИ ЗАМЕТКИ</p>
        <h1>Новая страница</h1>
        <p className="description">Место для ваших мыслей.</p>
      </header>
      <TextEditor
        initialContent={initialDocument}
        onChange={onChange}
        saveDelayMs={NOTE_SAVE_DELAY_MS}
        imageStorage={imageStorage}
        fileStorage={fileStorage}
        {...NOTE_CONTENT_LIMITS}
      />
      <footer role="status">
        <p>{error ?? (localSaved ? 'Сохранено локально' : 'Автосохранение на этом устройстве')}</p>
        <p>{syncText}</p>
      </footer>
    </main>
  )
}

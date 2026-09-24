import { useState } from 'react'
import { TextEditor } from '../../editor/TextEditor'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage } from './storage/noteStorage'
import { createRequestLogStorage } from './storage/requestLogStorage'
import { createRequestPreview } from '../../blocks/requests/createRequestPreview'
import { prepareInitialDocument } from './prepareInitialDocument'
import './document-page.css'

const NOTE_SAVE_DELAY_MS = 1000

export function DocumentPage({ noteId }: { noteId?: string }) {
  const [storage] = useState(() => createNoteStorage())
  const [initialNote] = useState(() => storage.load())
  const [initialDocument] = useState(() => prepareInitialDocument(initialNote.document))
  const [error, setError] = useState(initialNote.error)
  const [saveNote] = useState(() => createNoteSaveHandler(storage.save, setError, {
    preview: createRequestPreview(initialDocument, noteId),
    recordCycle: createRequestLogStorage(),
  }))

  return (
    <main className="document-page">
      <header>
        <p className="eyebrow">МОИ ЗАМЕТКИ</p>
        <h1>Новая страница</h1>
        <p className="description">Место для ваших мыслей.</p>
      </header>
      <TextEditor
        initialContent={initialDocument}
        onChange={saveNote}
        saveDelayMs={NOTE_SAVE_DELAY_MS}
      />
      <footer role="status">{error ?? 'Автосохранение на этом устройстве'}</footer>
    </main>
  )
}

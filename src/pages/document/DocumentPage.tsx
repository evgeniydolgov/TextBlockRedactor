import { useState } from 'react'
import { TextEditor } from '../../editor/TextEditor'
import { createNoteSaveHandler } from './createNoteSaveHandler'
import { createNoteStorage } from './storage/noteStorage'
import './document-page.css'

const NOTE_SAVE_DELAY_MS = 1000

export function DocumentPage() {
  const [storage] = useState(() => createNoteStorage())
  const [initialNote] = useState(() => storage.load())
  const [error, setError] = useState(initialNote.error)
  const [saveNote] = useState(() => createNoteSaveHandler(storage.save, setError))

  return (
    <main className="document-page">
      <header>
        <p className="eyebrow">МОИ ЗАМЕТКИ</p>
        <h1>Новая страница</h1>
        <p className="description">Место для ваших мыслей.</p>
      </header>
      <TextEditor
        initialContent={initialNote.document}
        onChange={saveNote}
        saveDelayMs={NOTE_SAVE_DELAY_MS}
      />
      <footer role="status">{error ?? 'Автосохранение на этом устройстве'}</footer>
    </main>
  )
}

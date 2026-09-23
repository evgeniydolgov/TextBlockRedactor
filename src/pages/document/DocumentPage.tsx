import { TextEditor } from '../../editor/TextEditor'
import './document-page.css'

export function DocumentPage() {
  return (
    <main className="document-page">
      <header>
        <p className="eyebrow">МОИ ЗАМЕТКИ</p>
        <h1>Новая страница</h1>
        <p className="description">Место для ваших мыслей.</p>
      </header>
      <TextEditor />
      <footer>Черновик · изменения пока не сохраняются</footer>
    </main>
  )
}

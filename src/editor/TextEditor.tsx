import { EditorContent } from '@tiptap/react'
import { useTextEditor } from './hooks/useTextEditor'
import type { TextEditorProps } from './model/document'
import { EditorToolbar } from './toolbar/EditorToolbar'
import './editor.css'

export function TextEditor(props: TextEditorProps) {
  const editor = useTextEditor(props)

  return (
    <section className="editor" aria-label="Редактор документа">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <p id="editor-hint" className="editor-hint">
        Нажмите на страницу и начните писать. Enter — новый абзац.
      </p>
    </section>
  )
}

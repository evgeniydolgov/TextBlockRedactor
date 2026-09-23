import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { editorExtensions } from './extensions'
import './editor.css'

type TextEditorProps = {
  initialContent?: JSONContent
  onChange?: (document: JSONContent) => void
}

const emptyDocument: JSONContent = {
  type: 'doc', content: [{ type: 'paragraph' }],
}

export function TextEditor({ initialContent = emptyDocument, onChange }: TextEditorProps) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'editor-content',
        role: 'textbox',
        'aria-label': 'Текст документа',
        'aria-multiline': 'true',
        'aria-describedby': 'editor-hint',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  })
  const activeBlock = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return 0
      for (const level of [1, 2, 3]) {
        if (editor.isActive('heading', { level })) return level
      }
      return 0
    },
  })
  return (
    <section className="editor" aria-label="Редактор документа">
      <div className="editor-toolbar" role="group" aria-label="Тип абзаца">
        <button type="button" disabled={!editor}
          aria-pressed={activeBlock === 0}
          onClick={() => editor?.chain().focus().setParagraph().run()}>
          Текст
        </button>
        {([1, 2, 3] as const).map((level) => (
          <button type="button" key={level} disabled={!editor}
            aria-label={'Заголовок ' + level}
            aria-pressed={activeBlock === level}
            onClick={() => editor?.chain().focus().setHeading({ level }).run()}>
            H{level}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <p id="editor-hint" className="editor-hint">
        Нажмите на страницу и начните писать. Enter — новый абзац.
      </p>
    </section>
  )
}

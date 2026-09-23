import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { editorBlocks } from '../blocks'
import './toolbar.css'

type EditorToolbarProps = {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const activeBlock = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return 'paragraph'
      return editorBlocks.find((block) => block.isActive(editor))?.id ?? 'paragraph'
    },
  })

  return (
    <div className="editor-toolbar" role="group" aria-label="Тип абзаца">
      {editorBlocks.map((block) => (
        <button
          type="button"
          key={block.id}
          disabled={!editor}
          aria-label={block.ariaLabel}
          aria-pressed={(activeBlock ?? 'paragraph') === block.id}
          onClick={() => editor && block.apply(editor)}
        >
          {block.label}
        </button>
      ))}
    </div>
  )
}

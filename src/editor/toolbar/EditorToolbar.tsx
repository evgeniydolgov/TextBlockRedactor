import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { editorBlocks } from '../blocks'
import { getActiveBlock } from '../blocks/getActiveBlock'
import { appendAttachment } from '../blocks/attachments/attachmentCommands'
import { resolveLimits } from '../limits/core/limits'
import './toolbar.css'

type EditorToolbarProps = {
  editor: Editor | null
  maxBlocks?: number
}

export function EditorToolbar({ editor, maxBlocks }: EditorToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({ active: getActiveBlock(editor), count: editor?.state.doc.childCount ?? 0 }),
  })
  const activeBlock = state?.active ?? 'paragraph'
  const limit = resolveLimits({ maxBlocks }).maxBlocks
  const attachmentSelected = activeBlock === 'image' || activeBlock === 'file'

  return (
    <div className="editor-toolbar" role="group" aria-label="Блоки заметки">
      {editorBlocks.map((block) => (
        <button
          type="button"
          key={block.id}
          disabled={!editor || attachmentSelected}
          aria-label={block.ariaLabel}
          aria-pressed={(activeBlock ?? 'paragraph') === block.id}
          onClick={() => editor && block.apply(editor)}
        >
          {block.label}
        </button>
      ))}
      {(['image', 'file'] as const).map(type => (
        <button
          type="button"
          key={type}
          disabled={!editor || (state?.count ?? 0) >= limit}
          onClick={() => appendAttachment(editor, type, limit)}
        >
          {type === 'image' ? 'Картинка' : 'Файл'}
        </button>
      ))}
    </div>
  )
}

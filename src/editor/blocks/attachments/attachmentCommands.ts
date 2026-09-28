import type { Editor } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import { closeHistory } from '@tiptap/pm/history'
import { createId } from '../../../shared/ids'
import { isAttachmentType, type AttachmentType } from '../../model/note/noteBlock'
import type { UploadedImage } from '../../images/imageStorage'
import type { UploadedFile } from '../../files/fileStorage'

export function canAppendAttachment(editor: Editor | null, maxBlocks: number): boolean {
  return !!editor && editor.state.doc.childCount < maxBlocks
}

function dispatchHistoryAction(editor: Editor, tr: Transaction) {
  editor.view.dispatch(closeHistory(tr).scrollIntoView())
  // Close the other side too: the next keystroke must not join this action.
  editor.view.dispatch(closeHistory(editor.state.tr))
  editor.view.focus()
}

export function appendAttachment(editor: Editor | null, type: AttachmentType, maxBlocks: number, generateId = createId) {
  if (!canAppendAttachment(editor, maxBlocks) || !editor) return false
  const { state } = editor
  const pos = state.doc.content.size
  const tr = state.tr.insert(pos, state.schema.nodes[type].create({ id: generateId() }))
  tr.setSelection(NodeSelection.create(tr.doc, pos))
  dispatchHistoryAction(editor, tr)
  return true
}

export function deleteSelectedAttachment(editor: Editor, generateId = createId) {
  const { state } = editor
  const { selection } = state
  if (!(selection instanceof NodeSelection) || !isAttachmentType(selection.node.type.name)) return false
  const tr = state.tr
  if (state.doc.childCount === 1) {
    tr.replaceWith(selection.from, selection.to, state.schema.nodes.paragraph.create({ id: generateId() }))
  } else {
    tr.delete(selection.from, selection.to)
  }
  dispatchHistoryAction(editor, tr)
  return true
}

export function updateImageAttachment(editor: Editor, pos: number, image: UploadedImage) {
  const node = editor.state.doc.nodeAt(pos)
  if (node?.type.name !== 'image') return false
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    url: image.id,
    name: image.name,
  })
  dispatchHistoryAction(editor, tr)
  return true
}

export function updateFileAttachment(editor: Editor, pos: number, blockId: string, file: UploadedFile) {
  const node = editor.state.doc.nodeAt(pos)
  if (node?.type.name !== 'file' || node.attrs.id !== blockId || node.attrs.url) return false
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    url: file.id,
    name: file.name,
  })
  editor.view.dispatch(closeHistory(tr))
  editor.view.dispatch(closeHistory(editor.state.tr))
  return true
}

export function canFormatText(editor: Editor) {
  return !editor.isActive('image') && !editor.isActive('file')
}

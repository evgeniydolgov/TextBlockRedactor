import type { Editor } from '@tiptap/core'
import { Schema } from '@tiptap/pm/model'
import { EditorState, NodeSelection, TextSelection } from '@tiptap/pm/state'
import { history, redo, undo } from '@tiptap/pm/history'
import { describe, expect, it, vi } from 'vitest'
import { appendAttachment, canAppendAttachment, deleteSelectedAttachment, updateImageAttachment } from '../attachmentCommands'

// Only the transaction/history model runs here: no Tiptap editor, DOM or browser.
const schema = new Schema({ nodes: {
  doc: { content: 'block+' },
  paragraph: { group: 'block', content: 'text*', attrs: { id: { default: null } } },
  text: {},
  image: { group: 'block', atom: true, attrs: {
    id: { default: null }, url: { default: '' }, name: { default: '' }, caption: { default: '' },
  } },
  file: { group: 'block', atom: true, attrs: { id: { default: null } } },
} })

function setup(onlyAttachment = false) {
  let state = EditorState.create({
    schema,
    doc: schema.node('doc', null, onlyAttachment
      ? [schema.node('image', { id: 'original' })]
      : [schema.node('paragraph', { id: 'p' }, schema.text('abc'))]),
    plugins: [history()],
  })
  const dispatch = vi.fn((tr: Parameters<EditorState['apply']>[0]) => { state = state.apply(tr) })
  const focus = vi.fn()
  const editor = { get state() { return state }, view: { dispatch, focus } } as unknown as Editor
  return { editor, dispatch, focus, get state() { return state } }
}

describe('attachment commands', () => {
  it.each(['image', 'file'] as const)('appends one %s without replacing selected text', type => {
    const s = setup()
    s.dispatch(s.state.tr.setSelection(TextSelection.create(s.state.doc, 1, 3)))
    const generate = vi.fn(() => 'new')
    expect(appendAttachment(s.editor, type, 2, generate)).toBe(true)
    expect(s.state.doc.childCount).toBe(2)
    expect(s.state.doc.firstChild?.textContent).toBe('abc')
    expect(s.state.doc.lastChild?.type.name).toBe(type)
    expect(s.state.doc.lastChild?.attrs.id).toBe('new')
    expect(s.state.selection).toBeInstanceOf(NodeSelection)
    expect(generate).toHaveBeenCalledOnce()
    expect(s.focus).toHaveBeenCalledOnce()
  })

  it('rejects a full document without IDs, dispatch or history and enables after deletion', () => {
    const s = setup()
    const generate = vi.fn(() => 'new')
    expect(appendAttachment(null, 'file', 2, generate)).toBe(false)
    expect(appendAttachment(s.editor, 'image', 1, generate)).toBe(false)
    expect(generate).not.toHaveBeenCalled()
    expect(s.dispatch).not.toHaveBeenCalled()
    expect(undo(s.state)).toBe(false)
    appendAttachment(s.editor, 'file', 2, generate)
    expect(canAppendAttachment(s.editor, 2)).toBe(false)
    deleteSelectedAttachment(s.editor)
    expect(canAppendAttachment(s.editor, 2)).toBe(true)
  })

  it('isolates insertions from typing and each other, restoring exact IDs on redo', () => {
    const s = setup()
    s.dispatch(s.state.tr.insertText('x', 2))
    appendAttachment(s.editor, 'image', 5, () => 'i')
    appendAttachment(s.editor, 'file', 5, () => 'f')
    expect(undo(s.state, s.dispatch)).toBe(true)
    expect(s.state.doc.childCount).toBe(2)
    expect(s.state.doc.lastChild?.attrs.id).toBe('i')
    undo(s.state, s.dispatch)
    expect(s.state.doc.textContent).toBe('axbc')
    expect(s.state.doc.childCount).toBe(1)
    redo(s.state, s.dispatch)
    redo(s.state, s.dispatch)
    expect(s.state.doc.lastChild?.attrs.id).toBe('f')
    s.dispatch(s.state.tr.insertText('z', 1))
    undo(s.state, s.dispatch)
    expect(s.state.doc.childCount).toBe(3)
    expect(s.state.doc.textContent).toBe('axbc')
  })

  it('deletes only the selected attachment and restores its ID and position', () => {
    const s = setup()
    appendAttachment(s.editor, 'image', 5, () => 'i')
    appendAttachment(s.editor, 'file', 5, () => 'f')
    s.dispatch(s.state.tr.setSelection(NodeSelection.create(s.state.doc, 5)))
    expect(deleteSelectedAttachment(s.editor)).toBe(true)
    expect(s.state.doc.childCount).toBe(2)
    expect(s.state.doc.textContent).toBe('abc')
    undo(s.state, s.dispatch)
    expect(s.state.doc.child(1).attrs.id).toBe('i')
    expect(s.state.doc.child(2).attrs.id).toBe('f')
    redo(s.state, s.dispatch)
    expect(s.state.doc.child(1).attrs.id).toBe('f')
  })

  it('replaces a lone attachment with an editable paragraph in the same history action', () => {
    const s = setup(true)
    s.dispatch(s.state.tr.setSelection(NodeSelection.create(s.state.doc, 0)))
    expect(deleteSelectedAttachment(s.editor, () => 'empty')).toBe(true)
    expect(s.state.doc.firstChild?.type.name).toBe('paragraph')
    expect(s.state.doc.firstChild?.attrs.id).toBe('empty')
    undo(s.state, s.dispatch)
    expect(s.state.doc.childCount).toBe(1)
    expect(s.state.doc.firstChild?.attrs.id).toBe('original')
  })

  it('delegates text Backspace without dispatch or generating an ID', () => {
    const s = setup()
    const generate = vi.fn()
    expect(deleteSelectedAttachment(s.editor, generate)).toBe(false)
    expect(s.dispatch).not.toHaveBeenCalled()
    expect(generate).not.toHaveBeenCalled()
  })

  it('updates image metadata as an isolated history action and preserves caption', () => {
    const s = setup()
    appendAttachment(s.editor, 'image', 5, () => 'image')
    const pos = s.state.doc.content.size - 1
    expect(updateImageAttachment(s.editor, pos, { id: 'stored', name: 'photo.png' })).toBe(true)
    expect(s.state.doc.nodeAt(pos)?.attrs).toEqual({
      id: 'image', url: 'stored', name: 'photo.png', caption: '',
    })
    undo(s.state, s.dispatch)
    expect(s.state.doc.nodeAt(pos)?.attrs).toEqual({ id: 'image', url: '', name: '', caption: '' })
    redo(s.state, s.dispatch)
    expect(s.state.doc.nodeAt(pos)?.attrs.url).toBe('stored')
    expect(updateImageAttachment(s.editor, 0, { id: 'ignored', name: 'ignored' })).toBe(false)
  })
})

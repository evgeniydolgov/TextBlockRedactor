import type { Slice } from '@tiptap/pm/model'
import type { EditorView } from '@tiptap/pm/view'
import { fitInsertion, textEnds } from './fitInsertion'
import type { ContentLimits } from './limits'
import { pasteEnds, pastePrefix } from './pastePrefix'
import { fitsTransaction } from './transactionContent'

export function insertLimitedText(
  view: Pick<EditorView, 'state' | 'dispatch'>,
  from: number,
  to: number,
  text: string,
  limits: ContentLimits,
): boolean {
  const tr = fitInsertion(textEnds(text), end => view.state.tr.insertText(text.slice(0, end), from, to),
    candidate => fitsTransaction(candidate, limits))
  if (tr && !tr.doc.eq(view.state.doc)) view.dispatch(tr.scrollIntoView())
  return true
}

export function insertLimitedPaste(
  view: Pick<EditorView, 'state' | 'dispatch'>,
  slice: Slice,
  limits: ContentLimits,
): boolean {
  const tr = fitInsertion(pasteEnds(slice), end => view.state.tr.replaceSelection(pastePrefix(slice, end)),
    candidate => fitsTransaction(candidate, limits))
  if (tr && !tr.doc.eq(view.state.doc)) {
    view.dispatch(tr.setMeta('paste', true).setMeta('uiEvent', 'paste').scrollIntoView())
  }
  return true
}

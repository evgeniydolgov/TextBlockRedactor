import type { NoteDocument } from '../../editor/model/note/noteBlock'

export function logNoteBlocks(blocks: NoteDocument) {
  console.log('[note:blocks]', JSON.stringify(blocks, null, 2))
}

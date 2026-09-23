import type { UniqueIDOptions } from '@tiptap/extension-unique-id'
import { createId } from '../../shared/ids'

export const uniqueIdOptions = {
  types: ['paragraph', 'heading'],
  attributeName: 'id',
  generateID: () => createId(),
} satisfies Partial<UniqueIDOptions>

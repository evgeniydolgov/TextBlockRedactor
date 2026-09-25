import type { UniqueIDOptions } from '@tiptap/extension-unique-id'
import { expect, it, vi } from 'vitest'
import { uniqueIdOptions } from './uniqueIdOptions'
import { createId } from '../../shared/ids'

vi.mock('../../shared/ids', () => ({ createId: vi.fn(() => 'generated-id') }))

it('uses the common generator without forwarding the editor context', () => {
  const generate: UniqueIDOptions['generateID'] = uniqueIdOptions.generateID
  const context = { node: { type: { name: 'paragraph' } }, pos: 12 }
  expect(generate(context as Parameters<typeof generate>[0])).toBe('generated-id')
  expect(createId).toHaveBeenCalledExactlyOnceWith()
  expect(uniqueIdOptions.types).toEqual(['paragraph', 'heading', 'image', 'file'])
  expect(uniqueIdOptions.attributeName).toBe('id')
})

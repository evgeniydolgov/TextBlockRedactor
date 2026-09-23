import type { Editor } from '@tiptap/core'
import { vi } from 'vitest'

// Only the boundary used by our block adapters; no Tiptap runtime.
export function createEditorStub(result = true) {
  const commands = {
    focus: vi.fn(() => commands),
    setParagraph: vi.fn(() => commands),
    setHeading: vi.fn((_attributes: { level: number }) => commands),
    run: vi.fn(() => result),
  }
  const chain = vi.fn(() => commands)
  const isActive = vi.fn((_name: string, _attributes?: { level: number }) => false)
  const editor = { chain, isActive } as unknown as Editor

  return { editor, chain, isActive, ...commands }
}

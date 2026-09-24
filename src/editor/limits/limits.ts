export type ContentLimits = {
  maxBlockCharacters: number
  maxNoteCharacters: number
  maxBlocks: number
}

export const defaultContentLimits: Readonly<ContentLimits> = {
  maxBlockCharacters: 8000,
  maxNoteCharacters: 50000,
  maxBlocks: 100,
}

export function resolveLimits(options: Partial<ContentLimits> = {}): ContentLimits {
  const positive = (value: number | undefined, fallback: number) =>
    value !== undefined && Number.isSafeInteger(value) && value > 0 ? value : fallback
  return {
    maxBlockCharacters: positive(options.maxBlockCharacters, defaultContentLimits.maxBlockCharacters),
    maxNoteCharacters: positive(options.maxNoteCharacters, defaultContentLimits.maxNoteCharacters),
    maxBlocks: positive(options.maxBlocks, defaultContentLimits.maxBlocks),
  }
}

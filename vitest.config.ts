import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/editor/blocks/paragraph.ts',
        'src/editor/blocks/headings.ts',
        'src/editor/blocks/getActiveBlock.ts',
        'src/editor/model/editorOptions.ts',
      ],
    },
  },
})

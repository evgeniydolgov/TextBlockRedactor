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
        'src/shared/ids.ts',
        'src/blocks/requests/diffBlocks.ts',
        'src/blocks/requests/buildBlockRequests.ts',
        'src/blocks/requests/createRequestPreview.ts',
        'src/pages/document/prepareInitialDocument.ts',
        'src/pages/document/logBlockRequests.ts',
        'src/pages/document/storage/requestLogStorage.ts',
        'src/editor/identity/uniqueIdOptions.ts',
        'src/editor/blocks/paragraph.ts',
        'src/editor/blocks/headings.ts',
        'src/editor/blocks/getActiveBlock.ts',
        'src/editor/model/editorOptions.ts',
        'src/editor/model/createDebouncedChange.ts',
        'src/editor/model/bindSaveLifecycle.ts',
        'src/editor/model/createEmptyNote.ts',
        'src/editor/model/validateNote.ts',
        'src/editor/model/blocksToTiptap.ts',
        'src/editor/model/tiptapToBlocks.ts',
        'src/editor/identity/preserveBlockIds.ts',
        'src/editor/identity/splitWithBlockIds.ts',
        'src/pages/document/logNoteBlocks.ts',
        'src/pages/document/createNoteSaveHandler.ts',
        'src/pages/document/storage/noteStorage.ts',
      ],
    },
  },
})

# Tasks

## 1. Узлы вложений

- [x] 1.1 Разделить `src/editor/blocks/AttachmentNode.ts` на `blocks/attachments/{FileNode,ImageNode,imageNodeView,imageViewElements,AttachmentKeyboard}.ts`, перенести туда `attachmentCommands.ts` и обновить `extensions.ts` и внутренние импорты. По diff сверить имена, attrs, порядок расширений, обработчики выбора/Backspace, upload/resolve и destroy; исходный файл удалить только после переноса всей логики.
- [x] 1.2 Передать модели Sol перенос и адресную адаптацию `attachmentCommands.test.ts` в `src/editor/blocks/attachments/tests/`; вместе с `src/editor/blocks/tests/{blockCommands,getActiveBlock}.test.ts` проверить командами `npm.cmd test -- src/editor/blocks/attachments/tests/attachmentCommands.test.ts` и `npm.cmd test -- src/editor/blocks/tests/blockCommands.test.ts src/editor/blocks/tests/getActiveBlock.test.ts`. Сверить по коду отсутствие изменений поведения при загрузке, выборе, удалении и undo/redo.

## 2. Модель заметки и лимиты

- [x] 2.1 Перенести `noteBlock.ts`, `createEmptyNote.ts`, `validateNote.ts`, `blocksToTiptap.ts`, `tiptapToBlocks.ts` в `src/editor/model/note/`, а `createDebouncedChange.ts`, `bindSaveLifecycle.ts`, `editorOptions.ts` в `src/editor/model/lifecycle/`; оставить `document.ts` контрактом в корне model. Обновить прямые импорты в `src/editor`, `src/pages/document` и `src/blocks/requests`; по diff проверить неизменность `TextEditorProps`, NoteDocument, преобразования, onChange и задержки сохранения.
- [x] 2.2 Передать модели Sol перенос тестов model: `blockIdentity`, `createEmptyNote`, `noteConversion`, `validateNote` в `src/editor/model/note/tests/`; `bindSaveLifecycle`, `createDebouncedChange`, `editorOptions` в `src/editor/model/lifecycle/tests/`. Обновить их импорты/fixtures и проверить `npm.cmd test -- src/editor/model/note/tests src/editor/model/lifecycle/tests`.
- [x] 2.3 Перенести `limits.ts`, `textBudget.ts`, `fitInsertion.ts`, `normalizeNote.ts` в `src/editor/limits/core/`; `inputHandlers.ts`, `pastePrefix.ts` в `src/editor/limits/input/`; `transactionContent.ts`, `limitController.ts`, `ContentLimits.ts` в `src/editor/limits/tiptap/`. Обновить потребителей в editor и странице; по diff проверить прежние defaults, расчёт символов и блоков, порядок фильтрации и обработки транзакций.
- [x] 2.4 Передать модели Sol перенос одноимённых тестов limits в `core/tests`, `input/tests`, `tiptap/tests` и обновление относительных импортов и `vi.mock`. Проверить `npm.cmd test -- src/editor/limits/core/tests src/editor/limits/input/tests src/editor/limits/tiptap/tests`.

## 3. Остальные локальные тесты и адресные ссылки

- [x] 3.1 Передать модели Sol перенос имеющихся `*.test.ts` из `src/editor/images`, `src/editor/identity`, `src/pages/document`, `src/pages/document/storage`, `src/blocks/requests` и `src/shared` в соседние каталоги `tests`; сохранить общие fixtures в `src/editor/testing`. Обновить импорты и проверить только перемещённые тесты: `npm.cmd test -- src/editor/images/tests src/editor/identity/tests src/pages/document/tests src/pages/document/storage/tests src/blocks/requests/tests src/shared/tests`.
- [x] 3.2 Обновить пути перемещённых исходников в `vitest.config.ts` (`coverage.include`), адресные команды тестов в документации незавершённых изменений и все затронутые импорты/экспорты. Проверить поиском старые пути в текущих исходниках, конфигурации и неархивных change-документах; глобальный coverage и полный suite не запускать.
- [x] 3.3 Если после разделения любой затронутый TS/TSX/CSS-файл остаётся длиннее 150 физических строк, записать в итоговом отчёте конкретную причину, почему дальнейшее разделение ухудшило бы ясность; сверить локальный подсчёт строк и diff затронутых файлов, не уплотняя форматирование. `src/App.css` оставить задаче `modularize-text-editor` 2.3.

## 4. Соглашения и завершение

- [x] 4.1 Добавить в `docs/agents/conventions.md` ориентир 100–150 физических строк для TS/TSX/CSS и группировку по ответственности, затем согласовать только пересечение с пунктом 3.1 `modularize-text-editor/tasks.md`, не отмечая весь пункт выполненным до обновления его README. Проверить изменённые разделы и локальные ссылки чтением.
- [x] 4.2 Сверить результаты уже выполненных адресных тестов из пунктов 1–3; повторить лишь те, на которые повлияли последующие правки. Выполнить только корректный ограниченный type-check, если он доступен, иначе указать ограничение. Прочитать diff затронутых файлов, сообщить пользователю о непроведённых по правилу проекта UI-проверках и предложить название коммита; не запускать полный gate, браузер, не менять индекс и не создавать коммит.

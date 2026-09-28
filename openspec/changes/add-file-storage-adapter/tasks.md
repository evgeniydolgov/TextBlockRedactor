# Tasks

## 1. Модель file-блока

- [x] 1.1 Расширить file props в `src/editor/model/note/noteBlock.ts`, `validateNote.ts`, `blocksToTiptap.ts` и `tiptapToBlocks.ts`: принимать и сохранять строковые `url`, `name`, `caption`, оставив пустые defaults и отсутствие content; проверить непустые значения, ID/порядок и прежние пустые документы в `src/editor/model/note/tests/validateNote.test.ts` и `noteConversion.test.ts` командой `npm.cmd test -- src/editor/model/note/tests/validateNote.test.ts src/editor/model/note/tests/noteConversion.test.ts`.

## 2. Адаптер и асинхронные операции

- [x] 2.1 Добавить `src/editor/files/fileStorage.ts` с контрактом и контроллером экземпляра, `src/editor/files/createMemoryFileStorage.ts` с `Map<ID, Blob>` и `createId`; проверить загрузку, выдачу исходного Blob, отсутствие ID и смену адаптера адресными `src/editor/files/tests/createMemoryFileStorage.test.ts` и `fileStorageController.test.ts` командой `npm.cmd test -- src/editor/files/tests/createMemoryFileStorage.test.ts src/editor/files/tests/fileStorageController.test.ts`.
- [x] 2.2 Добавить в `src/editor/files/` изолированную логику upload/download: запрет повторной загрузки, локальная ошибка/повтор, игнорирование результата после destroy; получение только по нажатию, URL/Blob, освобождение object URL и повтор скачивания после ошибки. Проверить в `src/editor/files/tests/fileUpload.test.ts` и `fileDownload.test.ts` командой `npm.cmd test -- src/editor/files/tests/fileUpload.test.ts src/editor/files/tests/fileDownload.test.ts` без UI/Tiptap runtime.

## 3. Интеграция file-блока

- [x] 3.1 Добавить `fileStorage?: FileStorageAdapter` в `src/editor/model/document.ts`, настроить контроллер в `src/editor/hooks/useTextEditor.ts` и передать его через `src/editor/extensions.ts` в file-узел; проверить чтением затронутых файлов, что `imageStorage` и image-узел не изменились, а проп остаётся необязательным.
- [x] 3.2 Обновить `src/editor/blocks/attachments/FileNode.ts` и локальные модули представления: пустой блок открывает выбор любого файла, показывает loading/error/retry; заполненный показывает сохранённое имя и «Скачать» без автоматического `resolve`. Сохранить выделение и Backspace. Проверить интеграцию с контрактом и отсутствие двоичных данных/временных состояний в документе чтением изменённых файлов; UI-сценарии передать пользователю для ручной проверки.
- [x] 3.3 Добавить в `src/editor/blocks/attachments/attachmentCommands.ts` обновление только исходного file-узла при совпадении типа, ID и пустого `url`, сохранив caption и отдельную отменяемую транзакцию. Проверить удаление до ответа, изменение соседних блоков, undo/redo и отсутствие записи в другой блок в `src/editor/blocks/attachments/tests/attachmentCommands.test.ts` командой `npm.cmd test -- src/editor/blocks/attachments/tests/attachmentCommands.test.ts`.
- [x] 3.4 Подключить `createMemoryFileStorage` в `src/pages/document/DocumentPage.tsx` рядом с image-адаптером; проверить чтением страницы и модели, что сохраняются только ID/имя и демонстрационное хранилище не переживает перезагрузку.

## 4. Документация и завершение

- [x] 4.1 Обновить `humanNavigation.md` по фактическим новым файлам, указав цепочку «выбор файла → upload → ID в заметке → скачивание по ID»; проверить изменённый раздел и относительные ссылки.
- [x] 4.2 После реализации прочитать diff только затронутых файлов и свести результаты адресных тестов из задач 1–3 без повторного запуска после достаточной проверки. Минимальный type-check выполнить только если его можно корректно ограничить затронутым кодом; иначе указать ограничение без полного `tsc`/build. Отдельно сообщить, что браузерные проверки не выполнялись по правилу проекта; не запускать полный quality gate и не создавать коммит.

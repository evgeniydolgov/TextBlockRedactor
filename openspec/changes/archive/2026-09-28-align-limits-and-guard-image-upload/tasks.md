# Tasks

## 1. Нормализация заметки

- [x] 1.1 Сверить `src/editor/limits/core/textBudget.ts` и локальный тест `src/editor/limits/core/tests/normalizeNote.test.ts` со сценарием в delta spec: после точного исчерпания бюджета сохраняются следующие подряд image/file, а следующий текстовый блок, включая пустой, останавливает обработку. Если существующий тест не покрывает пустой текстовый блок, дополнить только этот тест. Проверить командой `npm.cmd test -- src/editor/limits/core/tests/normalizeNote.test.ts`; алгоритм не менять.

## 2. Защита результата загрузки изображения

- [x] 2.1 Передавать ID исходного image-блока из `src/editor/blocks/attachments/imageNodeView.ts` в `updateImageAttachment` и проверять в `src/editor/blocks/attachments/attachmentCommands.ts` тип, совпадение ID и пустой `url` перед транзакцией. Проверить адресным unit-тестом успешную запись `url`/`name` при сохранении ID/caption и отсутствие записи при заполненном блоке.
- [x] 2.2 Исключить переиспользование image NodeView для блока с другим ID. Добавить в `src/editor/blocks/attachments/tests/attachmentCommands.test.ts` сценарий с отложенным результатом `upload`: до его завершения заменить исходный image-блок другим image-блоком в той же позиции и проверить, что поздний ответ не меняет новый блок и не создаёт транзакцию; проверить также удаление исходного блока. Запустить `npm.cmd test -- src/editor/blocks/attachments/tests/attachmentCommands.test.ts src/editor/images/tests/imageUpload.test.ts`.

## 3. Адресная проверка

- [x] 3.1 Прочитать diff только затронутых файлов и проверить локальные ссылки в документах change. Для изменённого TypeScript выполнить ограниченный type-check затронутых модулей, если его можно отделить от полного проекта; иначе зафиксировать это ограничение в отчёте. Убедиться по адресным тестам из пунктов 1.1 и 2.2, что успешная загрузка сохраняет обычные onChange и undo/redo; UI-сценарии перечислить для ручной проверки без запуска браузера.

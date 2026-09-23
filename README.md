# Минимальный текстовый редактор

## Разработка с агентами и OpenSpec

Начните с [AGENTS.md](AGENTS.md) и [процесса работы](docs/agents/README.md).
Текущие требования: [спецификация редактора](openspec/specs/text-editor/spec.md).
Блочный API до архивации описан в [изменении](openspec/changes/blocknote-compatible-note-model/specs/text-editor/spec.md).
Проверка спецификаций: `npm.cmd run spec:validate`.

React + TypeScript + Vite + Tiptap OSS + обычный CSS.
Backend и база данных для этого этапа не нужны. Все операции выполняются в браузере.
Нет платных расширений, облака и совместного редактирования.

## Запуск текущего проекта

Нужен Node.js, совместимый с Vite (здесь используется Node 24).

```powershell
npm.cmd ci
npm.cmd run dev
```

Адрес: http://127.0.0.1:3000. Браузер открывается автоматически.
Не запускайте второй dev-сервер для той же папки.
При ошибке `504 Outdated Optimize Dep` остановите текущий сервер (Ctrl+C)
и запустите `npm.cmd run dev -- --force`.

## Установка с нуля

```powershell
npm.cmd create vite@latest text-editor -- --template react-ts
cd text-editor
npm.cmd install
npm.cmd install @tiptap/react @tiptap/pm @tiptap/core @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text @tiptap/extension-heading @tiptap/extension-unique-id @tiptap/extensions
npm.cmd run dev
```

На macOS/Linux используйте `npm` вместо `npm.cmd`.
В новом шаблоне Vite адрес по умолчанию отличается; используйте адрес из терминала.

## Структура

```text
src/
  main.tsx                 # монтирование React
  App.tsx                  # страница приложения
  index.css                # общие стили
  editor/
    TextEditor.tsx         # редактор и кнопки типов абзаца
    extensions.ts          # схема документа и расширения
    editor.css             # стили содержимого
    model/                 # блочная модель и преобразования Tiptap
    identity/              # сохранение ID при split и смене типа
  pages/document/          # страница и logNoteBlocks
```

Подключены Document, Paragraph, Text, Heading (H1–H3), UndoRedo, UniqueID и адаптеры ID.
StarterKit не используется: на этом этапе списки, цитаты и форматирование не нужны.

## Самый короткий пример

Публичный компонент принимает массив блоков; Tiptap JSON остается внутри:

```tsx
import { TextEditor } from './editor/TextEditor'
import { createEmptyNote } from './editor/model/createEmptyNote'

const initialContent = createEmptyNote()

export function MyNote() {
  return <TextEditor initialContent={initialContent} onChange={(blocks) => {
    console.log('[note:blocks]', JSON.stringify(blocks, null, 2))
  }} />
}
```

В рабочем компоненте добавлены только кнопки «Текст / H1 / H2 / H3»,
доступные подписи и интерфейс initialContent/onChange.

## Как пользоваться

- Нажмите в пустую область и вводите текст. Backspace/Delete удаляют его.
- Enter создаёт новый блок; пустой заголовок по Enter становится абзацем.
- Кнопки «Текст», H1, H2, H3 меняют текущий блок.
- В начале строки можно набрать `# `, `## ` или `### ` для заголовка.
- Ctrl+Z — отмена, Ctrl+Shift+Z — повтор (на macOS — Cmd).

Текст хранится только в памяти. Обновление страницы сбрасывает документ.

## Аккуратное расширение

`initialContent` задаёт начальный `NoteDocument` — массив блоков paragraph/heading.
Это не управляемое React-поле: изменение этого пропа не загружает новый документ.
`onChange` получает новый массив блоков после изменений, а не `editor.getJSON()`.
ID сохраняется при вводе и смене типа. При разделении старый ID всегда у первого
фрагмента, включая пустой; второй получает новый ID.

Чтобы увидеть результат, откройте DevTools → Console и начните редактирование.
Страница выводит `[note:blocks]` с форматированным JSON после изменений документа.
Выделение текста само по себе не создает запись. Сохранения нет.
[Формат, ограничения и ручная проверка](docs/note-blocks.md).

Позже подключите сохранение через onChange, вне компонента редактора.
Для новых типов блоков добавляйте расширения в extensions.ts.
Используйте один экземпляр редактора на документ: абзацы и заголовки
уже являются узлами документа. Меню команд и перетаскивание можно добавить позже,
не создавая отдельный React state или отдельный редактор для каждого абзаца.

## Проверки

Unit-тесты запускаются через Vitest: он использует Vite и поддерживает TypeScript,
поэтому не требует отдельной настройки трансформации TS/ESM, как Jest.
Тесты находятся рядом с кодом в `*.test.ts` и работают в Node без браузера.

```powershell
npm.cmd test
npm.cmd run test:watch
npm.cmd run test:coverage
npm.cmd run build
npm.cmd run lint
```

`test` выполняет один прогон, `test:watch` следит за изменениями до Ctrl+C.
Проверяются только наши функции: команды и активность блоков, выбор активного
блока, конвертация/валидация заметки, адаптеры ID, onChange и logger. Методы редактора заменены
небольшими заглушками; тесты не создают Tiptap Editor и не рендерят React.
UI, скриншоты, snapshots и внутренняя логика Tiptap не тестируются.

V8 coverage охватывает собственную логику из `coverage.include` в vitest.config.ts,
а не всё приложение. Отчет выводится в терминал и
`coverage/coverage-summary.json`; папка исключена из Git. Проверка типов
выполняется командой `build`, отдельно от выполнения тестов.

Документация:
- https://tiptap.dev/docs/editor/getting-started/install/react
- https://tiptap.dev/docs/editor/extensions/nodes/heading
- https://tiptap.dev/docs/editor/extensions/functionality/undo-redo

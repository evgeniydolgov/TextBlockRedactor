# Минимальный текстовый редактор

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
npm.cmd install @tiptap/react @tiptap/pm @tiptap/core @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text @tiptap/extension-heading @tiptap/extensions
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
```

Подключены Document, Paragraph, Text, Heading (H1–H3), UndoRedo.
StarterKit не используется: на этом этапе списки, цитаты и форматирование не нужны.

## Самый короткий пример

Список расширений уже определён в `src/editor/extensions.ts`.
Минимальный компонент, использующий этот список:

```tsx
import { EditorContent, useEditor } from '@tiptap/react'
import { editorExtensions } from './extensions'

export function TextEditor() {
  const editor = useEditor({
    extensions: editorExtensions,
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  })

  return <EditorContent editor={editor} />
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

`initialContent` задаёт начальный JSON при создании редактора.
Это не управляемое React-поле: изменение этого пропа не загружает новый документ.
`onChange` получает `editor.getJSON()` после изменений.

Позже подключите сохранение через onChange, вне компонента редактора.
Для новых типов блоков добавляйте расширения в extensions.ts.
Используйте один экземпляр редактора на документ: абзацы и заголовки
уже являются узлами документа. Меню команд и перетаскивание можно добавить позже,
не создавая отдельный React state или отдельный редактор для каждого абзаца.

## Проверки

```powershell
npm.cmd run build
npm.cmd run lint
```

Документация:
- https://tiptap.dev/docs/editor/getting-started/install/react
- https://tiptap.dev/docs/editor/extensions/nodes/heading
- https://tiptap.dev/docs/editor/extensions/functionality/undo-redo

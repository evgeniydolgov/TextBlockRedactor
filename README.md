# Минимальный текстовый редактор

## Разработка с агентами и OpenSpec

Начните с [AGENTS.md](AGENTS.md) и [процесса работы](docs/agents/README.md).
Текущие требования: [формат блоков](openspec/specs/text-editor/spec.md#requirement-blocknote-compatible-supported-block-format)
и [автосохранение](openspec/specs/text-editor/spec.md#requirement-configurable-idle-delay)
в основной спецификации редактора.
Проверка спецификаций: `npm.cmd run spec:validate` — агентом только по явной команде полного quality gate.

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
  App.tsx                  # подключение страницы документа
  index.css                # общие стили
  editor/
    TextEditor.tsx         # композиция панели и редактируемого содержимого
    extensions.ts          # схема документа и расширения
    editor.css             # стили содержимого
    blocks/attachments/    # узлы image/file и их команды
    images/                # адаптер загрузки и получения изображений
    files/                 # адаптер загрузки и скачивания файлов
    model/note/            # формат, валидация и преобразования заметки
    model/lifecycle/       # onChange и жизненный цикл сохранения
    identity/              # сохранение ID при split и смене типа
    limits/core/           # расчёт ограничений
    limits/input/          # ввод и вставка
    limits/tiptap/         # интеграция с транзакциями Tiptap
    toolbar/               # кнопки типов блоков
  pages/document/          # страница, localStorage и logNoteBlocks
```

Подключены Document, Paragraph, Text, Heading (H1–H3), image, file, UndoRedo,
UniqueID и адаптеры ID.
StarterKit не используется: на этом этапе списки, цитаты и форматирование не нужны.

## Самый короткий пример

Публичный компонент принимает массив блоков; Tiptap JSON остается внутри:

```tsx
import { TextEditor } from './editor/TextEditor'
import { createEmptyNote } from './editor/model/note/createEmptyNote'

const initialContent = createEmptyNote()

export function MyNote() {
  return <TextEditor initialContent={initialContent} saveDelayMs={1000}
    maxBlockCharacters={8000} maxNoteCharacters={50000} maxBlocks={100} onChange={(blocks) => {
    console.log('[note:blocks]', JSON.stringify(blocks, null, 2))
  }} />
}
```

В рабочем компоненте есть кнопки «Текст / H1 / H2 / H3 / Картинка / Файл»,
доступные подписи, initialContent/onChange/saveDelayMs, три пропса лимитов и
необязательные адаптеры `imageStorage` и `fileStorage`.

## Как пользоваться

- Нажмите в пустую область и вводите текст. Backspace/Delete удаляют его.
- Enter создаёт новый блок; пустой заголовок по Enter становится абзацем.
- Кнопки «Текст», H1, H2, H3 меняют текущий блок.
- Кнопки «Картинка» и «Файл» добавляют блок в конец заметки. Внутри блока можно
  выбрать изображение или файл; после загрузки файл скачивается кнопкой «Скачать».
- В начале строки можно набрать `# `, `## ` или `### ` для заголовка.
- Ctrl+Z — отмена, Ctrl+Shift+Z — повтор (на macOS — Cmd).

Адаптеры загружают выбранный файл и возвращают его ID и имя. Заметка сохраняет
эти строки, а изображение получает содержимое по ID для показа. Файл запрашивается
по ID при нажатии «Скачать». На странице используются временные хранилища в памяти:
после перезагрузки блоки остаются в заметке, но их содержимое уже недоступно.

Заметка сохраняется в localStorage через секунду после последнего изменения
и восстанавливается после обновления страницы. При закрытии, обновлении или
скрытии вкладки ожидающие изменения сохраняются сразу, если браузер доставляет событие.
Время ожидания меняется константой `NOTE_SAVE_DELAY_MS` в
[DocumentPage.tsx](src/pages/document/DocumentPage.tsx), передаваемой в проп `saveDelayMs`.
Значение `0` отключает ожидание. Ошибки загрузки и сохранения отображаются под редактором.

Лимиты: 8000 единиц `.length` текста на блок, 50000 на заметку, 100 блоков.
Настройка `NOTE_CONTENT_LIMITS` в DocumentPage передаётся в пропсы редактора.
Переполнение блока переносится в обычный paragraph с новым UUID v7; вставка
принимается частично. При загрузке и уменьшении лимитов хвост обрезается.
[Точные правила подсчёта, настройки и ручные сценарии](docs/content-limits.md).

## Аккуратное расширение

`initialContent` задаёт начальный `NoteDocument` — массив блоков paragraph,
heading H1–H3, image и file.
Это не управляемое React-поле: изменение этого пропа не загружает новый документ.
`onChange` получает последний массив блоков после паузы `saveDelayMs` (по умолчанию
1000 мс), а не `editor.getJSON()`. Каждый ввод перезапускает ожидание.
ID сохраняется при вводе и смене типа. При разделении старый ID всегда у первого
фрагмента, включая пустой; второй получает новый ID.

Чтобы увидеть результат, откройте DevTools → Console и начните редактирование.
Страница выводит `[note:blocks]` с форматированным JSON вместе с отложенной передачей
или передачей при уходе. Выделение текста само по себе не создает запись.
[Формат, ограничения и ручная проверка](docs/note-blocks.md).

Сохранение подключено через onChange на странице, вне компонента редактора.
Ключ localStorage — `text-block-redactor:note:v1`, значение — JSON-массив NoteDocument.
Хранилище относится к текущему origin: другой адрес или порт имеет свою запись.
Описания API-запросов выводятся в Console под `[note:requests]`, без сетевых вызовов.
Последний цикл с запросами, полным документом и результатом записи находится в
localStorage под ключом `text-block-redactor:request-log:v1`.
[Контракт, база сравнения и ручная проверка](docs/block-api-requests.md).
Для новых типов блоков добавляйте расширения в extensions.ts.
Используйте один экземпляр редактора на документ: абзацы и заголовки
уже являются узлами документа. Меню команд и перетаскивание можно добавить позже,
не создавая отдельный React state или отдельный редактор для каждого абзаца.

## Проверки

Unit-тесты запускаются через Vitest: он использует Vite и поддерживает TypeScript,
поэтому не требует отдельной настройки трансформации TS/ESM, как Jest.
Тесты находятся в локальных папках `tests` рядом с соответствующими модулями и работают в Node без браузера.

При обычной разработке агент запускает только тесты затронутой области, например:

```powershell
npm.cmd test -- src/editor/limits/core/tests/fitInsertion.test.ts
```

Минимальный type-check используется при возможности ограничить его затронутым кодом;
если это невозможно, агент указывает ограничение и не запускает полный build.
Для Markdown достаточно чтения правок и ссылок. [Политика проверок](docs/agents/acceptance.md).
Команды полного прогона ниже доступны агенту только после явного запроса пользователя,
например `Run full quality gate`; обычная реализация не разрешает их запуск.

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run build
npm.cmd run lint
```

`test` выполняет один прогон. Для локального watch указывайте test-файл:
`npm.cmd run test:watch -- src/editor/limits/core/tests/fitInsertion.test.ts` (до Ctrl+C).
Проверяются только наши функции: команды и активность блоков, выбор активного
блока, конвертация/валидация заметки, адаптеры ID, задержка, lifecycle, localStorage,
onChange, logger, лимиты и планирование вставки. Методы редактора заменены
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

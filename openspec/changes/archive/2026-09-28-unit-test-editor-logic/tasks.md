# Tasks

## 1. Инфраструктура unit-тестов

- [x] 1.1 Установить совместимые с текущими Node/Vite версии Vitest и @vitest/coverage-v8 в devDependencies; проверить успешную установку и согласованность версий в package.json и lockfile.
- [x] 1.2 Добавить отдельный vitest.config.ts с Node, явными импортами API, поиском src/**/*.test.ts и V8 coverage для четырех модулей из design; проверить конфигурацию через TypeScript, исключить coverage из Git и не подключать browser/jsdom/dev-server.
- [x] 1.3 Добавить scripts test, test:watch, test:coverage согласно design; после появления тестов проверить, что npm.cmd test завершает однократный запуск, а coverage создает text/json-summary без браузера.

## 2. Проверки собственных функций

- [x] 2.1 Добавить небольшие заглушки используемых методов редактора и unit-тесты paragraph/headings; проверить команду, порядок focus/command/run, уровни H1–H3, передачу isActive и возврат true/false по матрице design, запустив соответствующие *.test.ts.
- [x] 2.2 Извлечь getActiveBlock из toolbar и подключить production-функцию обратно в selector; unit-тестами проверить каждый блок, null/undefined, отсутствие совпадений и приоритет первого совпадения; убедиться по diff, что JSX и поведение toolbar сохранены.
- [x] 2.3 Извлечь createEditorOptions и подключить ее к useTextEditor, сохранив extensions и публичные props; unit-тестами проверить default/переданный initialContent, onChange с JSON и отсутствие callback без вызова getJSON.
- [x] 2.4 Проверить границы набора тестов: нет создания Tiptap Editor, React-рендера, DOM, snapshots и копий production-алгоритмов; проверить импорты и размер новых файлов относительно ориентира 100–150 строк.

## 3. Документация и приемка

- [x] 3.1 Добавить в README выбор Vitest, команды и границы покрытия, а в docs/agents/acceptance.md — применимую unit-проверку; сверить команды с package.json и сохранить правила ручных коммитов и запрета самостоятельных браузерных проверок.
- [x] 3.2 Выполнить npm.cmd test, npm.cmd run test:coverage, npm.cmd run build и npm.cmd run lint; исправить ошибки в рамках change и проверить по отчету покрытие ветвей матрицы, честно указав оставшиеся пробелы без заявления о покрытии всего приложения.
- [x] 3.3 Выполнить npm.cmd run spec:validate и git diff --check, проверить состав diff и сохранность исходных CSS/соседних изменений; сообщить результаты и предложить название коммита, не выполняя git add/commit и не открывая браузер.

# Text editor

## Purpose

Зафиксировать базовое поведение локального редактора без сохранения,
backend, облака и совместного редактирования.

## Requirements

### Requirement: Basic text editing
The editor SHALL allow entering and deleting text in paragraphs.

#### Scenario: Enter text in an empty document
- **WHEN** пользователь ставит курсор в пустой редактор и вводит текст
- **THEN** текст отображается и остаётся доступным для редактирования

#### Scenario: Create a paragraph
- **WHEN** пользователь нажимает Enter в конце непустого абзаца
- **THEN** создаётся следующий абзац с курсором для продолжения ввода

#### Scenario: Delete text
- **WHEN** пользователь выделяет текст и нажимает Backspace или Delete
- **THEN** выделенный текст удаляется, а документ остаётся редактируемым

### Requirement: Basic headings
The editor SHALL support paragraphs and heading levels 1, 2 and 3.

#### Scenario: Change block type
- **WHEN** пользователь выбирает H1, H2 или H3 на панели
- **THEN** текущий текстовый блок становится заголовком выбранного уровня без потери текста

#### Scenario: Return to paragraph
- **WHEN** пользователь выбирает кнопку «Текст» внутри заголовка
- **THEN** заголовок становится обычным абзацем без потери текста

#### Scenario: Indicate active block
- **WHEN** пользователь перемещает курсор в абзац или заголовок
- **THEN** панель отражает активный тип блока через aria-pressed

### Requirement: Undo and redo
The editor SHALL support undo and redo of editing operations during the current session.

#### Scenario: Undo and redo typing
- **WHEN** пользователь вводит текст, отменяет ввод и повторяет действие
- **THEN** отмена удаляет введённый текст, а повтор восстанавливает его

### Requirement: In-memory draft
The application SHALL keep the draft only in memory and inform the user that changes are not saved.

#### Scenario: Reload the page
- **WHEN** пользователь обновляет страницу после редактирования
- **THEN** редактор открывается с пустым абзацем
- **AND** интерфейс сообщает, что изменения пока не сохраняются

### Requirement: Editor integration
The editor component SHALL accept initial JSON content and emit updated JSON through an optional callback.

#### Scenario: Initialize content
- **WHEN** компонент создаётся с initialContent
- **THEN** редактор использует этот JSON как начальный документ

#### Scenario: Report updates
- **WHEN** документ изменяется и передан обработчик onChange
- **THEN** обработчик получает актуальный JSON документа

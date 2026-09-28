# Spec Delta

## Purpose

Ограничивать объём текста и число блоков заметки до отображения и передачи наружу,
с настраиваемыми пределами и предсказуемым переносом переполненного текста.

## ADDED Requirements

### Requirement: Configurable content budgets
TextEditor SHALL accept maxBlockCharacters, maxNoteCharacters and maxBlocks, defaulting to 8000, 50000 and 100 respectively. Each SHALL be a positive safe integer; omitted or invalid values SHALL use its own default.

#### Scenario: Override limits
- **WHEN** родитель передаёт свои значения пропсов
- **THEN** они ограничивают этот экземпляр редактора независимо от других экземпляров
- **AND** настройки страницы вынесены наверх DocumentPage и передаются явно

#### Scenario: Invalid settings
- **WHEN** значение равно 0, отрицательно, дробно, NaN, Infinity или не является safe integer
- **THEN** только это значение заменяется своим default; остальные корректные настройки сохраняются

### Requirement: Text length definition
The editor SHALL count JavaScript string length (UTF-16 code units) of concatenated content[].text for each block and sum those lengths for the note. Spaces SHALL count; block boundaries, IDs, props and JSON encoding SHALL NOT count.

#### Scenario: Multiple text fragments
- **WHEN** блок содержит несколько элементов content с text
- **THEN** ограничивается сумма их длин, а не каждый элемент независимо
- **AND** абзацы и H1/H2/H3 считаются одинаково

#### Scenario: Unicode boundaries
- **WHEN** текст содержит emoji или комбинируемые символы
- **THEN** длина совпадает с .length: например, 😀 занимает 2 единицы
- **AND** разбиение/обрезка не оставляет половину корректной surrogate pair; при нехватке места пара переносится целиком либо отбрасывается

### Requirement: Split overflowing blocks
Text beyond the per-block limit SHALL continue in newly created paragraphs immediately after that block. The first fragment SHALL retain the original type, props and ID; each continuation SHALL have default paragraph props and a new UUID v7.

#### Scenario: Heading overflow
- **WHEN** H1 длиной 8000 получает ещё один обычный символ и другие лимиты позволяют
- **THEN** H1 сохраняет первые 8000 единиц, следующий paragraph содержит продолжение
- **AND** курсор после ввода находится после введённого символа в продолжении

#### Scenario: Long block and stable normalization
- **WHEN** блок содержит текст на несколько частей
- **THEN** создаётся нужное количество последовательных paragraph, каждый в пределах лимита
- **AND** порядок текста сохраняется, повторная обработка результата не меняет ID и не создаёт новых блоков

### Requirement: Trim initial content before rendering
Initial content SHALL be normalized in document order before editor rendering and preview initialization: split long blocks, retain at most maxBlocks blocks and at most maxNoteCharacters text units, discarding the remaining suffix.

#### Scenario: Oversized saved note
- **WHEN** initialContent или заметка из localStorage превышает лимиты
- **THEN** редактор и начальная база preview получают один и тот же допустимый документ с одинаковыми ID
- **AND** отброшенный текст не отображается, не попадает в onChange и не доступен через undo
- **AND** mount не создаёт запросов и не перезаписывает storage; последующее редактирование сохраняет только допустимое содержимое

#### Scenario: Block count and empty note
- **WHEN** после разбиения получается более 100 блоков при default настройках
- **THEN** сохраняются первые 100, включая пустые блоки, остальные отбрасываются
- **AND** пустой вход по-прежнему открывается с одним пустым paragraph

### Requirement: Fit editing into remaining capacity
Typing SHALL NOT increase text beyond the note limit or create blocks beyond the block limit. Paste SHALL keep the longest fitting prefix of incoming content and discard the remainder, accounting for replaced selection and overflow paragraphs while preserving existing unselected content.

#### Scenario: Full note and replacement
- **WHEN** заметка содержит 50000 единиц текста
- **THEN** ввод без выделения не добавляет символов и не удаляет прежний хвост
- **AND** удаление доступно; замена выделения допускает только объём, помещающийся после удаления выделенного текста

#### Scenario: Partial paste in the middle
- **WHEN** в заметке 49998 единиц и вставляется ABCD без выделения
- **THEN** вставляются AB в позиции курсора, CD отбрасывается, существующий текст после курсора сохраняется

#### Scenario: Block budget exhausted
- **WHEN** в документе maxBlocks блоков
- **THEN** Enter или переполнение не создают дополнительный блок; помещающийся в существующий блок текст можно вводить
- **AND** вставка принимает только префикс, не требующий превышения числа блоков

#### Scenario: Rejected action and selection
- **WHEN** действие не может добавить содержимое в пределах лимитов либо меняется только выделение
- **THEN** документ и ID не меняются; новый onChange, таймер сохранения или диагностический цикл не создаются

### Requirement: Consistent runtime limits and output
All accepted editing paths SHALL preserve the limits before document output. Runtime limit changes SHALL normalize existing content before displaying excess under the new limits; increasing limits SHALL NOT restore discarded content.

#### Scenario: Lower limits
- **WHEN** родитель уменьшает пропсы ниже текущего объёма
- **THEN** применяются правила обрезки начального документа, выделение переносится в допустимую позицию
- **AND** при фактическом изменении запускается обычный отложенный onChange с нормализованным снимком

#### Scenario: History, merge and input composition
- **WHEN** выполняется объединение, undo/redo или завершается составной ввод
- **THEN** итоговый документ соответствует текущим лимитам, без обхода ограничения через другой путь редактирования
- **AND** история не восстанавливает превышающий лимиты документ

#### Scenario: Autosave and requests
- **WHEN** допустимое изменение передано после паузы или при уходе
- **THEN** localStorage, preview запросов и последний диагностический цикл содержат только допустимый документ
- **AND** нормализация не создаёт отдельной повторной передачи промежуточного документа

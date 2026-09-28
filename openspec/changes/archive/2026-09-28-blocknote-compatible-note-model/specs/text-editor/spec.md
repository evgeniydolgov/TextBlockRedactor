# Spec Delta

## MODIFIED Requirements

### Requirement: Editor integration
The editor component SHALL accept an initial array of supported BlockNote-compatible blocks through initialContent and emit the current block array through an optional onChange callback. Tiptap JSON SHALL remain internal to the editor.

#### Scenario: Initialize content
- **WHEN** компонент создаётся с корректным массивом initialContent
- **THEN** редактор отображает блоки в заданном порядке с исходным текстом, типами, уровнями и ID
- **AND** переданный массив не мутируется; последующая смена initialContent не заменяет текущий документ

#### Scenario: Report updates
- **WHEN** документ изменяется и передан onChange
- **THEN** обработчик получает актуальный массив блоков в порядке документа без обертки doc и внутренних attrs Tiptap
- **AND** ранее переданные массивы не изменяются при последующем редактировании

#### Scenario: Optional callback
- **WHEN** onChange не передан
- **THEN** редактирование продолжает работать без ошибок и компонент редактора сам не пишет документ в консоль

#### Scenario: Empty initial content
- **WHEN** initialContent отсутствует или равен пустому массиву
- **THEN** создается один пустой paragraph с новым непустым ID и content: []

#### Scenario: Unsupported or invalid input
- **WHEN** initialContent содержит старый Tiptap JSON, неподдерживаемый тип/level, непустой children, форматирование/ссылки, нестандартные значения props, отсутствующий или повторяющийся ID
- **THEN** вход отклоняется с понятной ошибкой о проблемном блоке или поле до загрузки в редактор
- **AND** данные не обрезаются и не преобразуются в другой тип молча

## ADDED Requirements

### Requirement: BlockNote-compatible supported block format
The note SHALL use the documented BlockNote shape for the supported subset: paragraph and heading levels 1, 2 and 3 with plain text. Each block SHALL contain id, type, props, content and children. The document SHALL be a flat ordered array.

#### Scenario: Paragraph shape
- **WHEN** выдается paragraph
- **THEN** он содержит type: "paragraph" и props с backgroundColor: "default", textColor: "default", textAlignment: "left"
- **AND** content является массивом элементов { type: "text", text: string, styles: {} }, children равен []

#### Scenario: Heading shape
- **WHEN** выдается H1, H2 или H3
- **THEN** он содержит type: "heading", общие props paragraph, props.level равный 1, 2 или 3 и props.isToggleable: false
- **AND** content и children имеют тот же формат, что у paragraph; отдельные типы h1/h2/h3 не используются

#### Scenario: Preserve text and block boundaries
- **WHEN** документ содержит несколько блоков, пустые блоки, русский текст, emoji и пробелы
- **THEN** выход сохраняет порядок и границы блоков, весь текст и пробелы без trim
- **AND** пустой блок имеет content: []; соседние текстовые фрагменты без стилей допускается объединить, сохранив текст

#### Scenario: Supported round trip
- **WHEN** корректная заметка поддерживаемого подмножества загружается и затем преобразуется обратно без редактирования
- **THEN** ID, порядок, типы, уровни, props и текст совпадают с входом с учетом объединения текстовых фрагментов

### Requirement: Stable block identities
Every live block SHALL have a unique nonempty string ID. Editing existing content or changing its supported block type SHALL preserve its ID; exporting SHALL NOT generate replacement IDs.

#### Scenario: Edit or change type
- **WHEN** изменяется текст блока либо paragraph переключается в H1/H2/H3 и обратно
- **THEN** ID существующего блока остается прежним

#### Scenario: Create or duplicate blocks
- **WHEN** Enter разделяет блок или вставка создает новые блоки
- **THEN** новые блоки получают уникальные ID, не совпадающие с другими блоками документа
- **AND** при разделении первый сохранившийся фрагмент удерживает исходный ID; вставленная копия не получает ID оригинала

#### Scenario: Delete and merge
- **WHEN** блок удаляется или два блока объединяются
- **THEN** удаленный блок исчезает из массива, а сохранившийся блок сохраняет свой ID без перенумерации остальных

#### Scenario: Undo and redo
- **WHEN** операция редактирования, удаления или разделения отменяется и повторяется
- **THEN** текст, порядок и идентичность восстановленных блоков соответствуют состояниям истории, без дублирования ID

### Requirement: Console preview of note blocks
The note page SHALL log a readable JSON snapshot of the current block array after document changes, using console.log. Logging SHALL NOT persist or send the note to a service.

#### Scenario: Inspect edited note
- **WHEN** пользователь вводит текст, создает абзац, переключает тип блока или выполняет undo/redo
- **THEN** консоль получает запись с меткой "[note:blocks]" и актуальным JSON-массивом с отступами
- **AND** запись фиксирует состояние на момент события; последующие изменения не меняют старый вывод

#### Scenario: Selection only
- **WHEN** пользователь только перемещает курсор или выделение без изменения документа
- **THEN** новый вывод документа не создается

#### Scenario: Reload without persistence
- **WHEN** пользователь обновляет страницу
- **THEN** черновик сбрасывается как раньше, без записи или чтения localStorage, файлов, базы данных или сети

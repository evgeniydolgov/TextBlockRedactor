# Spec Delta

## Purpose

Формировать проверяемые описания запросов существующего API по изменениям блоков
заметки и показывать их локально, без сети, backend и обработки серверных ответов.

## ADDED Requirements

### Requirement: Net block changes
The adapter SHALL compare supported NoteDocument snapshots by block ID and semantic block content, producing only net creates, updates and deletes. It SHALL preserve IDs and SHALL NOT mutate inputs or generate IDs.

#### Scenario: Update an existing block
- **WHEN** у блока с прежним ID изменился текст, type, level или другое поддерживаемое поле
- **THEN** формируется один PUT /blocks/:blockId с полным текущим блоком в body
- **AND** неизменённые блоки и простое смещение индексов не создают PUT

#### Scenario: Equivalent content
- **WHEN** снимки отличаются только ссылками объектов, порядком ключей или разбиением соседнего plain text на фрагменты
- **THEN** запросов нет, если текст и все поддерживаемые поля совпадают

#### Scenario: Changes reverted during the delay
- **WHEN** изменения текста, создание или удаление блока отменены до передачи onChange
- **THEN** сравнивается итоговый снимок и для полностью отменённых изменений запросов нет

#### Scenario: Split and merge
- **WHEN** разделение сохраняет ID первого фрагмента и создаёт второй либо объединение удаляет один из блоков
- **THEN** новый ID создаёт CREATE, исчезнувший ID — DELETE, а изменённый сохранившийся блок — PUT
- **AND** PUT не формируется, если сохранившийся блок фактически не изменился

#### Scenario: Undo after a previous preview
- **WHEN** undo/redo изменяет состояние после уже выведенного набора запросов
- **THEN** строятся операции относительно последнего обработанного снимка, включая создание восстановленных ID

### Requirement: Existing API request shapes
Request descriptions SHALL contain method, path and body only when required, matching the supplied API for supported blocks. No network request SHALL be executed.

#### Scenario: Single create or delete
- **WHEN** создаётся одиночный блок либо удаляется ровно один ID
- **THEN** создаётся POST /blocks с body { block, position } либо DELETE /blocks/:blockId без поля body

#### Scenario: Consecutive creates
- **WHEN** два или более новых блока подряд находятся между одними внешними соседями
- **THEN** формируется один POST /blocks/list с body { operation: 'CREATE', blocks, position }
- **AND** blocks содержит только эту группу в порядке текущего документа

#### Scenario: Separated creates and multiple updates
- **WHEN** новые блоки разделены сохранившимися блоками либо изменено несколько существующих блоков
- **THEN** каждая непрерывная группа создаётся отдельно, а каждый изменённый существующий блок получает отдельный PUT
- **AND** не создаётся несуществующая групповая операция UPDATE

#### Scenario: Multiple deletions
- **WHEN** исчезли два или более ID
- **THEN** формируется один POST /blocks/list с body { operation: 'DELETE', ids }, ID идут в порядке старого документа
- **AND** поля blocks и position в этой операции отсутствуют

#### Scenario: Optional note context
- **WHEN** вызывающий код передал noteId
- **THEN** noteId включается в body групповых CREATE/DELETE
- **AND** при отсутствии noteId поле опускается; одиночные запросы не получают не предусмотренных контрактом полей
- **AND** ID заметки не генерируется и не выводится из ID блока

### Requirement: Neighbor positions and operation order
For a new block or consecutive group, before SHALL identify its previous external neighbor and after its next external neighbor in the final document; absent neighbors SHALL be null. Descriptions SHALL be ordered as deletions, updates, then creations.

#### Scenario: Insert a group between neighbors
- **WHEN** [A, B] превращается в [A, X, Y, B]
- **THEN** CREATE содержит blocks [X, Y] и position { before: A.id, after: B.id }

#### Scenario: Insert at boundaries
- **WHEN** новая группа находится в начале, конце или составляет весь документ
- **THEN** before равен null в начале, after равен null в конце, оба равны null без внешних соседей

#### Scenario: Replace a range
- **WHEN** [A, B, C, D] превращается в [A, X, Y, D]
- **THEN** сначала описывается DELETE для B/C, затем CREATE X/Y с before A.id и after D.id
- **AND** создаваемые группы не ссылаются на удалённые ID или внутренние ID своей группы

#### Scenario: Deterministic order
- **WHEN** одновременно есть удаления, обновления и несколько новых групп
- **THEN** после удаления идут PUT в текущем порядке документа, затем CREATE групп слева направо
- **AND** перестановки существующих блоков не превращаются в DELETE/CREATE или придуманные запросы перемещения

### Requirement: Preview baseline lifecycle
The preview session SHALL start from the editor's exact initial logical document and advance to a detached copy of each processed snapshot after producing its request descriptions. This baseline SHALL be independent of localStorage write success and SHALL NOT represent server acknowledgement.

#### Scenario: Initial mount and empty document
- **WHEN** открывается сохранённая заметка либо создаётся начальный пустой абзац
- **THEN** одинаковые начальные блоки и ID используются редактором и базой сравнения; запросы при mount не выводятся
- **AND** первый ввод в этот начальный абзац описывается PUT; ввод с полной отменой до паузы не создаёт запросов

#### Scenario: Failed storage write
- **WHEN** обработан новый снимок, но запись localStorage не удалась
- **THEN** preview всё равно выводит изменения и обновляет свою базу; существующее сообщение об ошибке записи сохраняется
- **AND** повторная обработка того же снимка не повторяет описания запросов

#### Scenario: Reload starts a new session
- **WHEN** страница открывается заново
- **THEN** база снова берётся из начальных блоков этой сессии; очередь и подтверждения сервера не восстанавливаются

### Requirement: Console preview alongside autosave
The page SHALL log a detached array of request description objects under "[note:requests]" for nonempty results, using the existing delayed onChange and departure flush. Existing local saving, block logging and storage error handling SHALL remain functional.

#### Scenario: Inspect requests after a pause or departure
- **WHEN** приходит отложенный onChange либо flush при уходе и есть итоговые операции
- **THEN** консоль получает один массив объектов { method, path, body? } в порядке выполнения
- **AND** поздние изменения не меняют старый вывод; HTTP, обработка ответов и второй таймер не добавляются

#### Scenario: No net changes
- **WHEN** итоговых операций нет, произошёл mount или изменилось только выделение
- **THEN** записи [note:requests] нет; существующее поведение localStorage и [note:blocks] не изменяется

### Requirement: Latest save cycle record
The page SHALL overwrite a single JSON object at localStorage key "text-block-redactor:request-log:v1" for each save cycle. It SHALL contain requests and storage { key, data, success, error }, with no history, timestamp or generated cycle ID. It SHALL describe request preparation and the actual note storage attempt, not HTTP execution.

#### Scenario: Record a completed save attempt
- **WHEN** отложенный onChange или flush обрабатывает снимок
- **THEN** после попытки записи заметки новый объект полностью заменяет предыдущий цикл
- **AND** requests содержит описания с method/path/body по контракту; storage.key равен "text-block-redactor:note:v1", data содержит полный переданный на запись документ
- **AND** success равен true и error равен null при успехе основной записи; при ошибке success равен false, error содержит её сообщение

#### Scenario: Empty operations in a save cycle
- **WHEN** цикл сохранения выполнен, но итоговых запросов нет
- **THEN** последний цикл перезаписывается с requests: [], актуальными data и результатом записи
- **AND** старые операции не остаются как результат нового цикла

#### Scenario: Mount and repeated flush
- **WHEN** происходит mount, изменение выделения или повторный flush без ожидающего снимка
- **THEN** диагностическая запись не создаётся и не перезаписывается
- **AND** существующая запись после reload доступна для просмотра, но не служит источником заметки или базы сравнения

#### Scenario: Diagnostic write failure
- **WHEN** запись последнего цикла не удалась
- **THEN** ошибка сообщается через console.warn, не прерывает редактирование и не меняет результат основной записи или базу preview
- **AND** повторный цикл автоматически не запускается, успех диагностической записи не заявляется

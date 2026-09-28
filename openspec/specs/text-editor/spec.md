# Text editor

## Purpose

Зафиксировать поведение локального редактора заметок с текстовыми блоками,
вложениями, ограничениями и сохранением метаданных на устройстве.

## Requirements

### Requirement: Basic text editing
The editor SHALL allow entering and deleting text in paragraphs within configured text and block limits, splitting overflowing text into paragraphs and fitting pasted content to available capacity.

#### Scenario: Enter text in an empty document
- **WHEN** пользователь ставит курсор в пустой редактор и вводит текст
- **THEN** допустимый текст отображается и остаётся доступным для редактирования

#### Scenario: Create a paragraph
- **WHEN** пользователь нажимает Enter в конце непустого абзаца
- **THEN** при наличии места по maxBlocks создаётся следующий абзац с курсором для продолжения ввода
- **AND** при исчерпанном лимите блоков документ не меняется

#### Scenario: Delete text
- **WHEN** пользователь выделяет текст и нажимает Backspace или Delete
- **THEN** выделенный текст удаляется, документ остаётся редактируемым, освободившийся объём можно использовать снова

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
The editor SHALL support undo and redo of editing operations during the current session while enforcing current content limits.

#### Scenario: Undo and redo typing
- **WHEN** пользователь вводит текст, отменяет ввод и повторяет действие
- **THEN** отмена удаляет введённый текст, а повтор восстанавливает допустимое действие с прежними ID
- **AND** автоматическое разбиение входит в ту же операцию истории, без промежуточного превышения

#### Scenario: History after limit reduction
- **WHEN** лимиты уменьшились и пользователь выполняет undo/redo
- **THEN** история не возвращает содержимое, превышающее новые лимиты

### Requirement: Editor integration
The editor component SHALL accept an initial array of supported BlockNote-compatible blocks through initialContent and emit the latest block array through an optional onChange callback after a configurable idle delay. Tiptap JSON SHALL remain internal to the editor.

#### Scenario: Initialize content
- **WHEN** компонент создаётся с корректным массивом initialContent
- **THEN** редактор отображает блоки в заданном порядке с исходным текстом, типами, уровнями и ID
- **AND** массив не мутируется; последующая смена initialContent не заменяет текущий документ

#### Scenario: Report updates
- **WHEN** документ изменяется и затем не меняется в течение saveDelayMs
- **THEN** переданный onChange получает один актуальный массив блоков без обёртки doc и attrs Tiptap
- **AND** ранее переданные массивы не меняются при дальнейшем редактировании

#### Scenario: Optional callback
- **WHEN** onChange не передан
- **THEN** редактирование работает без ошибок, вывода из редактора в консоль и записи самим редактором в localStorage

#### Scenario: Empty initial content
- **WHEN** initialContent отсутствует или равен пустому массиву
- **THEN** создаётся один пустой paragraph с новым UUID v7 и content: []

#### Scenario: Unsupported or invalid input
- **WHEN** initialContent содержит неподдерживаемый формат, блоки, props, content, children, отсутствующие или повторяющиеся ID
- **THEN** вход отклоняется с понятной ошибкой о проблемном блоке или поле до загрузки в редактор
- **AND** существующие непустые уникальные строковые ID принимаются без проверки версии UUID

### Requirement: Independent file storage adapter
Редактор SHALL принимать необязательный адаптер файлов, который загружает любой выбранный `File` с результатом `{ id, name }` и по строковому ID возвращает URL либо Blob для скачивания. Редактор SHALL считать ID непрозрачной строкой и SHALL NOT зависеть от конкретного файлового сервиса. Существующий адаптер изображений SHALL работать независимо.

#### Scenario: Adapter is available
- **WHEN** редактор создан с адаптером файлов и пользователь нажимает «Выбрать файл» в пустом file-блоке
- **THEN** открывается системный выбор файла без ограничения его типа
- **AND** выбранный `File` передаётся операции загрузки адаптера

#### Scenario: Adapter is absent
- **WHEN** редактор создан без адаптера файлов
- **THEN** выбор и скачивание в file-блоке недоступны без изменения заметки
- **AND** редактор не обращается к адаптеру изображений вместо файлового

### Requirement: Populated file block model
File-блок SHALL сохранять строковые `props.url`, `props.name` и `props.caption`; `url` SHALL содержать ID файла в хранилище. Эти свойства, ID блока и его позиция SHALL проходить без потерь через начальную заметку, представление редактора, `onChange` и существующее локальное сохранение. File-блок SHALL оставаться без текстового `content`.

#### Scenario: Empty file block
- **WHEN** пользователь нажимает существующую кнопку «Файл» на панели при наличии места по `maxBlocks`
- **THEN** в конец заметки добавляется один выделяемый file-блок с новым ID и пустыми `url`, `name`, `caption`
- **AND** внутри него отображается «Выбрать файл»

#### Scenario: Populated file round trip
- **WHEN** заметка содержит file-блок с непустыми строковыми `url`, `name` или `caption`
- **THEN** преобразование в представление редактора и обратно сохраняет эти значения, ID и положение блока
- **AND** локальный JSON заметки содержит только метаданные, без Blob, File, временного URL и состояний интерфейса

#### Scenario: Reload a saved reference
- **WHEN** сохранённая заметка с заполненным file-блоком открывается повторно
- **THEN** имя файла и кнопка «Скачать» отображаются по сохранённым свойствам без запроса содержимого
- **AND** ID и положение блока остаются прежними

### Requirement: File upload lifecycle
Выбор файла SHALL запустить загрузку без блокировки редактирования других блоков. Успешный результат SHALL одной отменяемой операцией записать возвращённые `id` и `name` в `props.url` и `props.name` того же блока, сохранив его ID, положение и `caption`; изменение SHALL пройти через обычный `onChange` и отложенное сохранение.

#### Scenario: Pending upload
- **WHEN** загрузка файла ещё выполняется, а пользователь продолжает редактировать заметку
- **THEN** file-блок показывает состояние загрузки и не допускает повторный выбор
- **AND** текущая заметка, включая пока пустой file-блок, продолжает сохраняться обычным способом

#### Scenario: Upload succeeds
- **WHEN** адаптер возвращает `{ id, name }` для существующего исходного file-блока
- **THEN** его `url` становится равен `id`, `name` становится равен возвращённому имени, а `caption` не меняется
- **AND** заполненный блок показывает имя и кнопку «Скачать»

#### Scenario: Upload fails
- **WHEN** загрузка отклонена с ошибкой
- **THEN** блок сохраняет прежние свойства, показывает понятную ошибку и вновь позволяет выбрать файл
- **AND** ошибка не попадает в заметку и историю редактора

#### Scenario: Block removed before upload completes
- **WHEN** исходный file-блок удалён до завершения загрузки
- **THEN** поздний результат не восстанавливает блок и не записывается в другой блок
- **AND** пользователь продолжает редактировать и сохранять заметку

#### Scenario: Undo and redo uploaded reference
- **WHEN** успешная загрузка заполнила пустой file-блок и пользователь выполняет undo, затем redo
- **THEN** undo возвращает блок с тем же ID к прежним свойствам, а redo восстанавливает ID файла и имя без повторной загрузки
- **AND** отмена или удаление блока не удаляет файл из адаптера

### Requirement: Download file on demand
Заполненный file-блок SHALL показывать сохранённое имя и кнопку «Скачать». Содержимое SHALL запрашиваться по `props.url` только после нажатия этой кнопки; ответ URL либо Blob SHALL использоваться для скачивания без изменения заметки. Созданный редактором object URL для Blob SHALL освобождаться после использования.

#### Scenario: Download URL
- **WHEN** пользователь нажимает «Скачать» и адаптер возвращает пригодный для скачивания URL
- **THEN** браузер начинает скачивание по этому URL
- **AND** редактор не сохраняет URL в заметке и не вызывает `onChange` из-за скачивания

#### Scenario: Download Blob
- **WHEN** пользователь нажимает «Скачать» и адаптер возвращает Blob
- **THEN** браузер получает скачивание файла с сохранённым именем
- **AND** временный object URL освобождается после запуска скачивания

#### Scenario: Download fails or file is unavailable
- **WHEN** получение по ID заканчивается ошибкой, включая отсутствие файла после перезагрузки демонстрационного хранилища
- **THEN** блок и его метаданные остаются без изменений, показывается понятная ошибка и кнопка позволяет повторить скачивание
- **AND** остальные действия редактора продолжают работать

### Requirement: In-memory file storage substitute
Приложение SHALL предоставлять демонстрационный адаптер, который назначает каждому загруженному файлу ID через существующий генератор и хранит Blob в памяти текущей страницы. Его контракт SHALL позволять заменить реализацию настоящим файловым сервисом без изменения редактора; бинарные данные SHALL NOT записываться в заметку или localStorage.

#### Scenario: Upload and download in one session
- **WHEN** файл загружен через демонстрационный адаптер и затем запрошен по возвращённому ID в той же сессии
- **THEN** адаптер возвращает исходный Blob

#### Scenario: Reload clears memory storage
- **WHEN** страница перезагружена после сохранения file-блока
- **THEN** его ID, имя и положение восстанавливаются из заметки, но демонстрационный адаптер сообщает об отсутствии Blob при нажатии «Скачать»

### Requirement: Preserve existing editor behavior with files
File-блок SHALL по-прежнему занимать одно место в `maxBlocks` и не расходовать лимиты текстовых символов независимо от заполненности файловых свойств. Добавление, выделение, Backspace и undo/redo SHALL сохранять существующее поведение; paragraph, heading и image SHALL работать по прежним правилам.

#### Scenario: Capacity and text limits
- **WHEN** file-блок получает ID файла и имя
- **THEN** число блоков и расход текстовых символов не меняются
- **AND** при исчерпанном `maxBlocks` кнопка добавления «Файл» остаётся недоступной

#### Scenario: Delete a selected populated file
- **WHEN** заполненный file-блок выделен и пользователь нажимает Backspace, затем Ctrl+Z
- **THEN** блок удаляется и восстанавливается с тем же ID блока, файловым ID, именем и положением

### Requirement: BlockNote-compatible supported block format
The note SHALL use the documented BlockNote shape for supported plain-text paragraph and heading levels 1, 2 and 3. Each text block SHALL contain id, type, props, content and children. The document SHALL be a flat ordered array that can also contain supported attachments without text content.

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
The note page SHALL log a readable JSON snapshot with the label "[note:blocks]" for each delayed or flushed onChange delivery. Logging SHALL NOT send the note to a service.

#### Scenario: Inspect edited note
- **WHEN** истёк период ожидания после ввода, создания блока, изменения типа или undo/redo
- **THEN** консоль получает один актуальный JSON-массив с отступами
- **AND** последующие изменения не меняют старую запись; страница также пытается сохранить массив локально

#### Scenario: Selection only
- **WHEN** пользователь только меняет курсор или выделение без изменения документа
- **THEN** новый вывод не создаётся и срок ожидающей передачи не сдвигается

### Requirement: UUID v7 entity identifiers
All newly generated entity identifiers in the note data SHALL be RFC 9562 UUID version 7 strings in every creation path. Existing nonempty unique string IDs SHALL be accepted and preserved without UUID-version validation during loading or serialization. Technical type keys and DOM accessibility anchors are not entity identifiers.

#### Scenario: Create an empty note
- **WHEN** редактор создаёт начальный пустой блок
- **THEN** ID блока имеет формат UUID v7

#### Scenario: Split a block
- **WHEN** пользователь разделяет блок, в том числе в начале текста
- **THEN** первый фрагмент сохраняет исходный ID независимо от его формата, даже если фрагмент пустой
- **AND** второй получает новый UUID v7, отличный от существующих ID

#### Scenario: Paste or generate a missing internal identity
- **WHEN** вставка или обработка документа создаёт новые блоки либо требует назначения ID внутреннему узлу
- **THEN** назначаемые ID являются UUID v7, в том числе при замене дубликата вставленной копии

#### Scenario: Load and preserve valid identifiers
- **WHEN** initialContent содержит непустые уникальные строковые ID, включая UUID v4, UUID v7 или "123", и поддерживаемые блоки
- **THEN** идентификаторы принимаются и сохраняются без перегенерации при вводе, смене типа, экспорте и восстановлении истории

#### Scenario: Preserve existing basic validation
- **WHEN** входной блок содержит пустой, нестроковый ID или точный дубликат строки ID
- **THEN** вход отклоняется с ошибкой, указывающей blocks[index].id
- **AND** система не исправляет и не заменяет эти ID молча

#### Scenario: Export integrity
- **WHEN** документ передается через onChange или выводится в консоль
- **THEN** новые ID имеют формат UUID v7, а ранее переданные ID сохраняются без проверки версии UUID
- **AND** порядок блоков соответствует документу, а не сортировке по UUID

### Requirement: Configurable idle delay
TextEditor SHALL expose saveDelayMs in milliseconds, defaulting to 1000. Each document change SHALL restart the delay; editing SHALL remain immediate. Only the latest state SHALL be delivered when the delay expires, except for an immediate flush on departure.

#### Scenario: Continuous changes
- **WHEN** документ изменяется несколько раз с интервалами менее 1000 мс при настройке по умолчанию
- **THEN** до истечения 1000 мс после последнего изменения нет onChange, записи или вывода блоков
- **AND** по истечении ожидания происходит одна передача последнего состояния

#### Scenario: Custom and zero delay
- **WHEN** родитель задаёт saveDelayMs равным 2000 или 0
- **THEN** ожидание составляет 2000 мс либо отключается при 0

#### Scenario: Invalid delay
- **WHEN** saveDelayMs отрицательный, не конечный или превышает 2147483647
- **THEN** используется безопасное значение по умолчанию 1000 мс

#### Scenario: Change configuration while pending
- **WHEN** во время ожидания меняется saveDelayMs
- **THEN** отсчёт начинается заново с новым значением и последним состоянием документа
- **AND** замена onChange использует актуальный callback, не перезапуская ожидание; его удаление отменяет передачу

#### Scenario: Mount and rerender
- **WHEN** редактор открывается или родитель перерисовывается без изменения документа и задержки
- **THEN** новый таймер не создаётся, существующее ожидание не сбрасывается и запись не производится

### Requirement: Local note persistence
The note page SHALL store one current NoteDocument in localStorage and restore it on opening. It SHALL preserve supported block data and existing IDs without version validation or regeneration, and SHALL keep editing available if storage fails.

#### Scenario: Save and reopen
- **WHEN** onChange передал блоки, запись удалась и пользователь перезагрузил страницу
- **THEN** восстанавливаются порядок, текст, типы, уровни, props и ID сохранённых блоков
- **AND** история undo/redo начинается заново; сетевых запросов для сохранения нет

#### Scenario: Missing or empty note
- **WHEN** запись отсутствует либо содержит корректный пустой массив
- **THEN** открывается пустой редактируемый абзац; mount сам не перезаписывает хранилище

#### Scenario: Clear existing text
- **WHEN** пользователь удалил весь текст и истекла задержка
- **THEN** сохраняется пустая заметка и прежний текст не возвращается при перезагрузке

#### Scenario: Invalid or inaccessible storage
- **WHEN** чтение недоступно, JSON повреждён либо сохранённые данные не соответствуют поддерживаемому NoteDocument
- **THEN** страница показывает пустой редактор и сообщение о проблеме загрузки
- **AND** исходная запись не удаляется и не перезаписывается до явного редактирования пользователем

#### Scenario: Write failure
- **WHEN** запись не удалась, например из-за ограничения объёма или доступа
- **THEN** текущий текст остаётся в редакторе и отображается сообщение об ошибке сохранения
- **AND** очередная передача после редактирования снова пытается сохранить заметку; успешная запись убирает ошибку

### Requirement: Flush pending changes on departure
The application SHALL immediately deliver and synchronously attempt to save pending changes when the page becomes hidden, on pagehide, or when the editor unmounts. Repeated departure signals SHALL NOT duplicate an already delivered update.

#### Scenario: Leave before timeout
- **WHEN** пользователь закрывает, обновляет или скрывает страницу до истечения задержки и браузер доставляет событие ухода
- **THEN** последнее ожидающее состояние немедленно передаётся на сохранение без ожидания таймера
- **AND** при успешной записи оно доступно после повторного открытия

#### Scenario: Cleanup and repeated signals
- **WHEN** после передачи приходят повторные события ухода, истекает прежний таймер или происходит cleanup
- **THEN** повторной передачи того же ожидающего изменения нет, прежний таймер отменён, а при cleanup подписки удалены
- **AND** при повторной активации редактора последующий ввод снова сохраняется обычным образом

### Requirement: Empty attachment block format
Заметка SHALL поддерживать плоские блоки image и file в дополнение к paragraph и heading H1–H3. Новые пустые вложения SHALL иметь уникальный непустой ID, children: [] и нетекстовое content: undefined (поле отсутствует в JSON), с указанными ниже значениями по умолчанию. Заполненные вложения SHALL сохранять строковые `url`, `name` и `caption` по требованиям их адаптеров.

#### Scenario: File placeholder shape
- **WHEN** создаётся или выдаётся пустой file
- **THEN** type равен "file", props равен { backgroundColor: "default", name: "", url: "", caption: "" }
- **AND** блок не содержит текстового массива content и имеет children: []

#### Scenario: Image placeholder shape
- **WHEN** создаётся или выдаётся пустой image
- **THEN** type равен "image", props содержит backgroundColor: "default", textAlignment: "left", name: "", url: "", caption: "", showPreview: true, previewWidth: undefined
- **AND** previewWidth и content отсутствуют в JSON, children равен []

#### Scenario: Input validation
- **WHEN** передан image/file с отсутствующим или повторяющимся ID, текстовым content, непустыми children, нестроковыми `url`/`name`/`caption` либо неподдерживаемыми значениями остальных props
- **THEN** вход отклоняется с понятной ошибкой о проблемном поле
- **AND** неизвестные типы по-прежнему отклоняются; корректный JSON с пустыми или непустыми строковыми файловыми полями принимается

### Requirement: Append attachment placeholders
Панель SHALL содержать кнопки «Картинка» и «Файл» рядом с H1–H3. Каждое разрешённое нажатие SHALL добавлять ровно один блок соответствующего типа в конец заметки с новым ID, независимо от текущего курсора или выделения, без изменения существующих блоков.

#### Scenario: Append from a text selection
- **WHEN** курсор или выделение находятся в середине текста и нажата «Картинка» либо «Файл» при наличии места по maxBlocks
- **THEN** после последнего блока появляется одна соответствующая заготовка с новым ID
- **AND** существующий текст, выделенное содержимое, ID и порядок прежних блоков сохраняются; добавленный блок выделяется

#### Scenario: Repeated additions
- **WHEN** пользователь последовательно добавляет image и file при наличии двух свободных мест
- **THEN** в конце находятся два отдельных блока в порядке добавления с разными ID
- **AND** дополнительные пустые абзацы автоматически не добавляются

### Requirement: Inert attachment placeholder presentation
Пустой image SHALL отображать кнопку «Выбрать изображение», а file — «Выбрать файл». Кнопка SHALL быть неактивной только при отсутствии соответствующего адаптера; при наличии адаптера выбор SHALL работать по требованиям загрузки. Блок SHALL оставаться выделяемым независимо от доступности кнопки.

#### Scenario: Disabled action
- **WHEN** отображается пустой image или file без соответствующего адаптера
- **THEN** видна соответствующая кнопка с disabled-состоянием
- **AND** действие не открывает системный диалог, не меняет документ и не создаёт запись истории

#### Scenario: Available action
- **WHEN** пустой image или file имеет соответствующий адаптер и пользователь нажимает кнопку выбора
- **THEN** открывается системный диалог выбора для этого типа вложения
- **AND** дальнейшая загрузка выполняется через соответствующий адаптер

#### Scenario: Select a placeholder
- **WHEN** пользователь выбирает область заготовки либо достигает блока клавиатурой
- **THEN** выделяется весь блок с видимым состоянием выделения
- **AND** внутри заготовки нельзя вводить текст; текстовые кнопки панели не преобразуют её в paragraph/heading

### Requirement: Attachment deletion and history
Выделенный целиком image/file SHALL удаляться по Backspace. Добавление и удаление SHALL быть отдельными отменяемыми действиями существующей истории; повтор и отмена SHALL сохранять ID восстановленного блока и соблюдать текущие лимиты. Новые кнопки undo/redo SHALL NOT добавляться.

#### Scenario: Undo and redo insertion
- **WHEN** пользователь добавляет заготовку, выполняет undo, затем redo при неизменных лимитах
- **THEN** undo удаляет только добавленную заготовку, redo возвращает её с прежним ID на прежнее место
- **AND** соседнее редактирование текста не объединяется с добавлением в одно действие отмены

#### Scenario: Delete selected attachment
- **WHEN** image/file выделен целиком и пользователь нажимает Backspace
- **THEN** выделенный блок удаляется без удаления соседнего текста
- **AND** Ctrl+Z восстанавливает блок с прежними ID, типом и положением; redo повторяет удаление

#### Scenario: Backspace in text
- **WHEN** пользователь нажимает Backspace внутри текста без выделенного целиком image/file
- **THEN** работает существующее текстовое редактирование, а не отмена последнего добавления вложения

#### Scenario: Delete the only placeholder
- **WHEN** единственный блок заметки является выделенным image/file и удаляется Backspace
- **THEN** редактор остаётся доступным для ввода с пустым paragraph
- **AND** undo восстанавливает прежнюю заметку с исходным ID заготовки

### Requirement: Attachment persistence and round trip
image/file SHALL проходить через initialContent, onChange и существующее локальное сохранение наравне с текстовыми блоками. Преобразование в редактор и обратно SHALL сохранять тип, ID, props и порядок; отсутствие undefined-полей в JSON SHALL NOT считаться повреждением данных.

#### Scenario: Mixed document reload
- **WHEN** заметка с paragraph, H1–H3, image и file сохранена существующим механизмом и страница перезагружена
- **THEN** типы, ID, props и порядок восстановлены, текст сохранён, а пустые и заполненные вложения отображаются согласно своим сохранённым метаданным
- **AND** бинарные данные и временные object URL не появляются в заметке; сохранённые строковые файловые ID остаются в `props.url`

#### Scenario: Existing output lifecycle
- **WHEN** добавление или удаление заготовки вызывает изменение заметки
- **THEN** текущий массив передаётся через обычный отложенный onChange и сохранение при уходе
- **AND** существующий диагностический цикл корректно обрабатывает новые типы без HTTP-запросов

#### Scenario: Existing text documents
- **WHEN** загружается ранее сохранённая заметка только с paragraph и heading
- **THEN** она принимается без миграции, с прежними текстом, ID и поведением редактирования

### Requirement: Attachment capacity accounting
Каждый image/file SHALL занимать одно место в maxBlocks и ноль единиц в maxBlockCharacters/maxNoteCharacters. Лимиты SHALL соблюдаться при добавлении, загрузке, изменении лимитов и undo/redo; оставшиеся в допустимом префиксе заготовки SHALL сохранять нетекстовый формат.

#### Scenario: Last available block
- **WHEN** в заметке maxBlocks - 1 блоков и добавляется заготовка
- **THEN** число блоков становится maxBlocks, обе кнопки добавления становятся недоступны
- **AND** дальнейшее добавление не меняет документ, ID, историю и не запускает onChange

#### Scenario: Capacity released
- **WHEN** после удаления блока количество становится меньше maxBlocks
- **THEN** обе кнопки добавления снова доступны

#### Scenario: Text budget exhausted
- **WHEN** текст достиг maxNoteCharacters, но есть место по maxBlocks
- **THEN** заготовку можно добавить и сохранить без удаления текста
- **AND** при восстановлении документа этот нетекстовый блок не отбрасывается только из-за исчерпания текстового бюджета

#### Scenario: Reduced block limit
- **WHEN** смешанная заметка превышает maxBlocks при загрузке или уменьшении лимита
- **THEN** сохраняется допустимый префикс по существующим правилам, считая каждую заготовку одним блоком
- **AND** сохранённые заготовки не превращаются в текстовые блоки; undo/redo не возвращает превышение текущих лимитов

### Requirement: Independent image storage adapter
Редактор SHALL принимать необязательный адаптер изображений без зависимости от конкретного файлового сервиса. Адаптер SHALL загружать локальный `File` с результатом `{ id, name }` и разрешать сохранённый ID в готовый URL либо Blob; ID SHALL трактоваться редактором как непрозрачная строка.

#### Scenario: Adapter is available
- **WHEN** редактор создан с адаптером изображений
- **THEN** пустой image-блок предоставляет доступную кнопку «Выбрать изображение»
- **AND** загрузка и получение выполняются только через переданные операции адаптера

#### Scenario: Adapter is absent
- **WHEN** редактор создан без адаптера изображений
- **THEN** кнопка выбора в пустом image-блоке недоступна
- **AND** редактор не пытается загружать или получать файл другим способом

#### Scenario: Adapter instance changes
- **WHEN** компонент получает другой экземпляр адаптера при существующем image-блоке с файловым ID
- **THEN** последующие операции используют новый экземпляр
- **AND** изображение повторно разрешается через новый экземпляр без изменения документа

### Requirement: Populated image block model
Image-блок SHALL хранить строковые `props.url`, `props.name` и `props.caption`; `url` SHALL содержать ID изображения в выбранном хранилище. Эти свойства SHALL проходить без потерь через initialContent, внутреннее представление Tiptap, onChange и существующее локальное сохранение, при этом остальные поддерживаемые свойства image-блока сохраняют текущие значения и ограничения.

#### Scenario: Empty image block
- **WHEN** создаётся новая заготовка image
- **THEN** её `url`, `name` и `caption` равны пустым строкам
- **AND** блок сохраняет отсутствие текстового content

#### Scenario: Populated image round trip
- **WHEN** документ содержит image с непустыми строковыми `url`, `name` или `caption`
- **THEN** преобразование в Tiptap и обратно сохраняет эти значения, ID блока и положение
- **AND** сериализация в JSON не добавляет Blob, object URL или временные состояния интерфейса

#### Scenario: Reload populated image
- **WHEN** image-блок с файловым ID и именем сохранён обычным механизмом заметки и документ загружен повторно
- **THEN** его `url`, `name`, `caption`, ID и положение восстановлены до попытки получить изображение

### Requirement: Image upload lifecycle
Кнопка пустого image-блока SHALL открывать системный выбор изображения и передавать выбранный файл в `upload`. Успешный результат SHALL обновлять тот же блок одной отменяемой операцией: записывать результат `id` в `props.url`, результат `name` в `props.name` и сохранять прежний `props.caption`.

#### Scenario: Successful upload
- **WHEN** пользователь выбирает изображение и `upload` успешно возвращает ID и имя
- **THEN** на время запроса блок показывает «Загрузка…» и не допускает повторный выбор
- **AND** после успеха тот же блок получает возвращённые `url` и `name`, не меняя ID, положение и caption
- **AND** обновлённый документ проходит через обычный onChange и сохранение

#### Scenario: Upload fails
- **WHEN** `upload` завершается ошибкой
- **THEN** `url`, `name` и caption блока не изменяются
- **AND** блок показывает локальную ошибку и снова позволяет выбрать файл
- **AND** ошибка и состояние загрузки не передаются в onChange и не сохраняются

#### Scenario: Undo and redo uploaded reference
- **WHEN** успешная загрузка записала ID и имя в ранее пустой image-блок, после чего пользователь выполняет undo и redo
- **THEN** undo возвращает этот блок с прежним ID к пустым `url` и `name`
- **AND** redo восстанавливает полученные ID и имя без повторного вызова `upload`
- **AND** ни undo, ни удаление блока не запрашивают удаление файла из хранилища

### Requirement: Stored image resolution and display
Image-блок с непустым `props.url` SHALL получить изображение через `resolve` текущего адаптера и показать возвращённый URL или Blob. Получение SHALL быть представлением сохранённого блока и не должно менять документ, историю или цикл сохранения.

#### Scenario: Resolve a direct URL
- **WHEN** `resolve` для файлового ID возвращает готовый URL
- **THEN** image-блок показывает изображение с этим URL
- **AND** URL не записывается дополнительно в документ и не освобождается редактором

#### Scenario: Resolve a Blob
- **WHEN** `resolve` возвращает Blob
- **THEN** image-блок создаёт object URL, показывает изображение и владеет временем жизни этого object URL
- **AND** object URL освобождается при смене ссылки, повторном разрешении или уничтожении блока

#### Scenario: Resolve fails
- **WHEN** получение изображения завершается ошибкой или адаптер не может найти ID
- **THEN** image-блок остаётся в документе с прежними props и показывает локальную ошибку с возможностью повторить получение
- **AND** ошибка не вызывает onChange и не попадает в undo/redo

#### Scenario: Stale asynchronous result
- **WHEN** ID, адаптер или жизненный цикл блока изменяется до завершения предыдущего `resolve`
- **THEN** устаревший результат не отображается и не заменяет состояние нового запроса
- **AND** редактор не оставляет созданный им object URL без освобождения

### Requirement: In-memory image storage substitute
Приложение SHALL предоставлять демонстрационный адаптер, который назначает загружаемому изображению новый ID и хранит Blob в памяти текущей страницы. Эта реализация SHALL соответствовать тому же контракту, что и внешний сервис, и SHALL заменяться без изменений кода редактора.

#### Scenario: Upload and resolve during one session
- **WHEN** изображение загружено через демонстрационный адаптер и затем разрешается по возвращённому ID в той же сессии
- **THEN** адаптер возвращает исходный Blob и изображение может быть показано

#### Scenario: Reload clears the substitute storage
- **WHEN** страница перезагружена после сохранения image-блока
- **THEN** блок и его строковый ID восстанавливаются из localStorage
- **AND** демонстрационный адаптер сообщает ошибку получения, потому что Blob не сохранялся между сессиями

### Requirement: Preserve unrelated editor behavior
Добавление загрузки image SHALL сохранять существующее поведение текстовых блоков, лимитов и независимого file-блока. Каждый image SHALL по-прежнему занимать одно место в maxBlocks и не расходовать текстовые лимиты независимо от заполненности файловых props.

#### Scenario: File placeholder remains unchanged
- **WHEN** пользователь выбирает или выделяет file-блок
- **THEN** его операции используют только файловый адаптер и не вызывают адаптер изображений
- **AND** доступность выбора и скачивания определяется файловым адаптером

#### Scenario: Populated image and text limits
- **WHEN** пустой image получает файловый ID и имя
- **THEN** количество блоков и расход текстовых символов не меняются
- **AND** редактирование paragraph и H1–H3 продолжает работать по существующим правилам

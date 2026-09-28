# Spec Delta

## REMOVED Requirements

### Requirement: In-memory draft
**Reason**: Пользователь запросил сохранение заметки в localStorage.
**Migration**: Использовать Local note persistence; при отсутствии записи начинать с пустого абзаца.

## MODIFIED Requirements

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

### Requirement: Console preview of note blocks
The note page SHALL log a readable JSON snapshot with the label "[note:blocks]" for each delayed or flushed onChange delivery. Logging SHALL NOT send the note to a service.

#### Scenario: Inspect edited note
- **WHEN** истёк период ожидания после ввода, создания блока, изменения типа или undo/redo
- **THEN** консоль получает один актуальный JSON-массив с отступами
- **AND** последующие изменения не меняют старую запись; страница также пытается сохранить массив локально

#### Scenario: Selection only
- **WHEN** пользователь только меняет курсор или выделение без изменения документа
- **THEN** новый вывод не создаётся и срок ожидающей передачи не сдвигается

## ADDED Requirements

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

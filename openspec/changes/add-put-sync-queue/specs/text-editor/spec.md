# Spec Delta

## MODIFIED Requirements

### Requirement: Local note persistence
The note page SHALL store one current NoteDocument in localStorage and restore it on opening. It SHALL preserve supported block data and existing IDs without version validation or regeneration, and SHALL keep editing available if storage fails. Local persistence SHALL remain independent of the optional PUT adapter; without that adapter no network save SHALL occur.

#### Scenario: Save and reopen
- **WHEN** onChange передал блоки, запись удалась и пользователь перезагрузил страницу
- **THEN** восстанавливаются порядок, текст, типы, уровни, props и ID сохранённых блоков
- **AND** история undo/redo начинается заново; без подключённого PUT-адаптера сетевых запросов для сохранения нет

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

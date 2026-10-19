# Spec Delta

## Purpose

Позволить редактору передавать изменения существующих блоков через независимый асинхронный адаптер PUT, не блокируя ввод, не теряя порядок изменений одного блока и сохраняя неподтверждённые правки при ошибке или неизвестном исходе запроса.

## ADDED Requirements

### Requirement: Optional PUT transport and trusted baseline
The note page SHALL accept an optional asynchronous `putBlock(block)` adapter for existing server blocks. The adapter SHALL receive a complete current block with its stable ID. Without the adapter or a trusted confirmed baseline, the page SHALL keep local editing and saving available but SHALL NOT claim server synchronization or treat a locally loaded document as server-confirmed.

#### Scenario: Adapter is absent
- **WHEN** страница работает без PUT-адаптера
- **THEN** локальное сохранение и диагностический preview продолжают работать без отправки и без статуса «синхронизировано с сервером»

#### Scenario: Trusted baseline is absent
- **WHEN** адаптер подключён, но не предоставлена подтверждённая база существующих серверных блоков и нет пригодной ранее сохранённой подтверждённой базы
- **THEN** страница не отправляет PUT на основании одного лишь локального документа и сообщает, что серверная синхронизация не инициализирована

### Requirement: Parallel PUT with per-block ordering
After the existing `saveDelayMs` pause, changed blocks present in the trusted baseline SHALL be eligible for PUT. The queue SHALL permit requests for different block IDs to run concurrently up to a fixed documented limit; no more than one PUT for a given ID SHALL be in flight. Editing SHALL remain available throughout.

#### Scenario: Four independently changed blocks
- **WHEN** до окончания паузы изменены существующие блоки 2, 4, 6 и 8
- **THEN** в очередь попадают последние версии именно этих четырёх блоков, остальные не отправляются
- **AND** PUT разных ID могут выполняться параллельно в пределах общего лимита

#### Scenario: Same block changes during PUT
- **WHEN** PUT версии A блока 2 ещё выполняется, а пользователь последовательно вводит версии B и C
- **THEN** второй PUT блока 2 не начинается до завершения первого
- **AND** после подтверждения A при необходимости отправляется последняя версия C без отдельной отправки B

### Requirement: Acknowledged state and failed requests
The queue SHALL advance a block's confirmed state only after successful completion of the PUT for the exact sent snapshot. While a request is pending, no later PUT for the same ID SHALL start, even if the local block changes. A failed or timed-out request SHALL leave the newest local state unconfirmed and stop automatic PUT for that ID; the page SHALL show an error without blocking other block IDs. An unanswered request SHALL remain pending and SHALL NOT trigger a later PUT for that ID. This change SHALL NOT automatically retry failed requests.

#### Scenario: Older response arrives after further typing
- **WHEN** сервер подтвердил отправленную версию A блока, пока локально уже существует версия C
- **THEN** подтверждённой считается только A, C остаётся ожидающей отправки
- **AND** ответ на A не заменяет C в редакторе или локальном черновике

#### Scenario: Request fails or times out
- **WHEN** PUT отклонён либо адаптер завершил ожидание ошибкой или таймаутом без подтверждения
- **THEN** отправленный блок не считается подтверждённым и последняя локальная версия остаётся в черновике
- **AND** очередь не отправляет для этого ID ни повтор, ни новую версию; показывается ошибка, а другие ID могут продолжать синхронизацию

#### Scenario: Request remains unanswered
- **WHEN** адаптер ещё не завершил ожидающий PUT успехом или ошибкой
- **THEN** очередь не запускает следующий PUT для того же ID и сохраняет локальные правки независимо от длительности ожидания

### Requirement: Durable local draft and restart recovery
The page SHALL keep the latest local NoteDocument and separate confirmed PUT state needed for recovery. Before starting a PUT, it SHALL durably record that request as unresolved. Pending network activity SHALL NOT be assumed to finish on departure. After a normal close or reload, changes that were not sent MAY start from the latest local document; an ID with an unresolved or failed PUT SHALL NOT be retransmitted automatically. Newer local content SHALL NOT be replaced with older acknowledgements.

#### Scenario: Reload with unresolved PUT
- **WHEN** локальный черновик был сохранён, PUT отправлен, но не подтверждён до закрытия страницы
- **THEN** редактор показывает последний локальный документ и восстанавливает подтверждённую базу
- **AND** для ID этого PUT показывает ошибку и не начинает автоматическую повторную отправку, пока будущая интеграция не выяснит исход запроса

#### Scenario: Reload before PUT was sent
- **WHEN** локальный черновик был сохранён, но PUT для изменённого существующего блока ещё не начинался
- **THEN** после открытия его последняя локальная версия может быть отправлена при наличии доверенной базы

#### Scenario: Ack persistence is interrupted
- **WHEN** успешный ответ получен, но запись подтверждённой базы и снятие отметки о нерешённом PUT не завершились до закрытия
- **THEN** при повторном открытии блок не объявляется подтверждённым и автоматически не отправляется повторно

#### Scenario: Local storage fails
- **WHEN** черновик или сведения для восстановления не удаётся сохранить локально
- **THEN** редактирование остаётся доступным, но интерфейс сообщает, что восстановление неподтверждённых правок после закрытия не гарантировано
- **AND** страница не показывает состояние «сохранено локально» или «полностью синхронизировано» для этих правок

#### Scenario: Unresolved marker cannot be saved
- **WHEN** локальную отметку о начале PUT не удалось сохранить до отправки
- **THEN** PUT не начинается, а страница показывает ошибку хранения

### Requirement: Honest synchronization status and scope
The page SHALL distinguish local persistence, PUT synchronization in progress, and synchronization error. It SHALL show full server synchronization only when every current block is confirmed and there are no pending or unsupported structural changes. New blocks and deletions SHALL remain preview-only in this change.

#### Scenario: PUT completes while a new block remains local
- **WHEN** все PUT существующих блоков подтверждены, но новый блок ещё не создан на сервере
- **THEN** страница не показывает полную серверную синхронизацию; CREATE остаётся только в существующем preview

#### Scenario: Block removed during its PUT
- **WHEN** блок удалён локально, пока выполняется его PUT
- **THEN** поздний ответ не восстанавливает блок и не запускает ещё один PUT удалённого блока
- **AND** удаление остаётся неподтверждённым и только preview описывает DELETE

#### Scenario: Existing diagnostics remain independent
- **WHEN** обработан снимок заметки при включённой PUT-очереди
- **THEN** `[note:requests]` и журнал последнего цикла сохраняют прежний диагностический смысл
- **AND** их база сравнения не используется как подтверждённая сервером база очереди

# Spec Delta

## ADDED Requirements

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

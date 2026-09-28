# Spec Delta

## MODIFIED Requirements

### Requirement: Trim initial content before rendering
Initial content SHALL be normalized in document order before editor rendering and preview initialization: split long text blocks, retain at most maxBlocks blocks and at most maxNoteCharacters text units. Once the text budget is exhausted, immediately following image/file blocks SHALL remain in order while block capacity remains; the next text block, including an empty one, SHALL end normalization and the rest of the document SHALL be discarded.

#### Scenario: Oversized saved note
- **WHEN** initialContent или заметка из localStorage превышает лимиты
- **THEN** редактор и начальная база preview получают один и тот же допустимый документ с одинаковыми ID
- **AND** отброшенный текст не отображается, не попадает в onChange и не доступен через undo
- **AND** mount не создаёт запросов и не перезаписывает storage; последующее редактирование сохраняет только допустимое содержимое

#### Scenario: Block count and empty note
- **WHEN** после разбиения получается более 100 блоков при default настройках
- **THEN** сохраняются первые 100, включая пустые блоки, остальные отбрасываются
- **AND** пустой вход по-прежнему открывается с одним пустым paragraph

#### Scenario: Attachments immediately after the text budget
- **WHEN** текстовый блок заканчивается точно на maxNoteCharacters и за ним следуют image и file при наличии места по maxBlocks
- **THEN** оба вложения сохраняются в исходном порядке с прежними ID и props, не расходуя текстовый бюджет

#### Scenario: Text block after exhausted budget
- **WHEN** после исчерпания maxNoteCharacters и сохранённого image следующим идёт пустой paragraph, а за ним file
- **THEN** нормализация останавливается перед paragraph и отбрасывает его вместе с последующим file
- **AND** вложение из отброшенного хвоста не переносится через текстовый блок

#### Scenario: Budget ends inside a text block
- **WHEN** maxNoteCharacters заканчивается внутри текстового блока, а следующий блок является image или file
- **THEN** сохраняется только допустимый текстовый префикс; следующее вложение не добавляется

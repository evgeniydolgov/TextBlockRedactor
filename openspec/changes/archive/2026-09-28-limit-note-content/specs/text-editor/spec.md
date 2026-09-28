# Spec Delta

## MODIFIED Requirements

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

### Requirement: Undo and redo
The editor SHALL support undo and redo of editing operations during the current session while enforcing current content limits.

#### Scenario: Undo and redo typing
- **WHEN** пользователь вводит текст, отменяет ввод и повторяет действие
- **THEN** отмена удаляет введённый текст, а повтор восстанавливает допустимое действие с прежними ID
- **AND** автоматическое разбиение входит в ту же операцию истории, без промежуточного превышения

#### Scenario: History after limit reduction
- **WHEN** лимиты уменьшились и пользователь выполняет undo/redo
- **THEN** история не возвращает содержимое, превышающее новые лимиты

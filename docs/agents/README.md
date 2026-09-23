# Работа с агентами

## Карта документов

- [AGENTS.md](../../AGENTS.md) — короткая точка входа.
- [conventions.md](conventions.md) — правила реализации и коммитов.
- [task-template.md](task-template.md) — исходная постановка задачи.
- [acceptance.md](acceptance.md) — общий критерий готовности.
- [openspec/specs/](../../openspec/specs/) — актуальное поведение продукта.
- [openspec/changes/](../../openspec/changes/) — предлагаемые изменения и архив.
- [openspec/config.yaml](../../openspec/config.yaml) — контекст для CLI.

Требования к продукту хранятся в спецификациях. Правила работы — в этих документах.
Не дублируйте требования в нескольких местах.

## Установка и команды

После клонирования выполните `npm.cmd ci`. OpenSpec закреплён в devDependencies,
глобальная установка не требуется. На macOS/Linux используйте npm вместо npm.cmd.

```powershell
npm.cmd run spec -- --version
npm.cmd run spec -- list
npm.cmd run spec:validate
```

Обёртка scripts/openspec.mjs отключает телеметрию для этих команд.
Инициализация выполнена через `init --tools none`: slash-команды и навыки
конкретных агентов не устанавливались. Агент читает AGENTS.md и вызывает CLI.
Файлы спецификаций и изменения хранятся локально в Git.
Не запускайте повторный init для обычной задачи.

## Рабочий цикл

1. Прочитайте задачу, git status и текущую спецификацию. Обозначьте цель,
   границы и критерии по [шаблону](task-template.md).
2. Для нового поведения создайте изменение с коротким именем kebab-case:

```powershell
npm.cmd run spec -- new change add-local-save
npm.cmd run spec -- instructions proposal --change add-local-save
```

Имя add-local-save — пример, а не поручение реализовать сохранение.

3. Следуйте инструкциям схемы spec-driven. Создайте proposal.md (зачем и что),
   specs/<capability>/spec.md (изменения требований),
   design.md (решения и компромиссы), tasks.md (проверяемые шаги).
   Получайте шаблоны и зависимости через CLI:

```powershell
npm.cmd run spec -- status --change add-local-save
npm.cmd run spec -- instructions specs --change add-local-save
npm.cmd run spec -- instructions design --change add-local-save
npm.cmd run spec -- instructions tasks --change add-local-save
```

4. В delta-спецификации используйте разделы ADDED/MODIFIED/REMOVED Requirements.
   В MODIFIED включайте полное требование и его сценарии. Сохраняйте служебные
   заголовки Requirement/Scenario и ключевые слова SHALL, WHEN, THEN на английском.
   Пояснения пишите по-русски.
5. Проверьте предложение: `npm.cmd run spec -- validate add-local-save --strict --no-interactive`.
   Реализуйте только поставленную задачу; существенное расширение границ обсудите с пользователем.
6. Выполните проверки, отметьте выполненные пункты tasks.md.
   В отчёте перечислите результат, проверки и ограничения.
7. После завершения изменения архивируйте его:

```powershell
npm.cmd run spec -- archive add-local-save --yes
npm.cmd run spec:validate
```

Архивация обновляет основные спецификации из delta-файлов и переносит изменение
в changes/archive/. Проверьте diff. Не архивируйте незавершённую работу и не
отключайте валидацию. Для чисто инфраструктурного изменения без delta допустим
флаг --skip-specs с пояснением причины.

Исправления без изменения требований и мелкие правки Markdown могут идти напрямую.
Не создавайте фиктивные продуктовые изменения ради документации.

## Источники

- [Официальный OpenSpec](https://github.com/Fission-AI/OpenSpec)
- [CLI](https://openspec.dev/docs/cli)

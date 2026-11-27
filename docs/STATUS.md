# STATUS — текущее состояние (короткая страница)

> Не журнал и не норма. Нормы: PROJECT.md → AGENTS.md → DESIGN.md → docs/ENVIRONMENT.md.
> Обновляется при смене P0-указателя или решения. Счётчики страниц, функций и миграций здесь не хранятся — берите из кода.

## P0-указатель
Ignatev Estate: Layantara (resort portfolio) + Condominiums. Цель приёмки: одна бронь Layantara от quote до checkout и P&L, с изоляцией команд и консолидированным обзором основателя. Это цель, а не доказательство выполнения (см. README.md).

## Базы данных
- Production: Lovable Cloud, проект kakkwibljrjsawxgnupk (docs/ENVIRONMENT.md). Миграции применяются через Lovable Cloud.
- Supabase MCP в сессиях агентов НЕ имеет доступа к production; показываемые им проекты (hueotfhvvbxaijccmhnc, viejnaqprjpqadtzvjgo) не production. Никогда не применять DDL к ним.
- Staging нет: preview, published и myuno.app используют одну production-БД.

## Решения «да/нет» (действующие)
- Layantara: каталог из 39 вилл импортирован как inactive; публичный листинг и лендинг отключены. Публикация — отдельный контролируемый релиз после quote-engine, parity-тестов, сверки блокировок и верификации (docs/LAYANTARA_APPLICATION_PARITY.md, 2026-10-21).
- Одобрение партнёрских заявок: approve-partner-application намеренно возвращает partner_decision_contract_unavailable до утверждения контракта решения (docs/hardening/partner-decisions/2026-11-17-commercial-acceptance.md).

## Ожидают решения владельца
Список будет вестись в docs/OPEN_SECURITY_DECISIONS.md (создаётся отдельным шагом).

## Проверенные SHA
- main при последнем чтении репозитория: 5cc37b71dd71e5391e45a74347006c9f6f85f668 (2026-11-27). Это состояние репозитория, а не подтверждённый деплой.

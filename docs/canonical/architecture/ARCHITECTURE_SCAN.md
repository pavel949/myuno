# Architecture & Surfaces Scan — 2026-08-28

Автоматический контроль: `npm run scan:architecture` (`--strict` в CI падает при DB-дрейфе).
Скрипт: [`scripts/architecture-scan.mjs`](../../../scripts/architecture-scan.mjs).

## 1 · Что сканируется

| Класс дрейфа | Правило |
|---|---|
| **DB drift** | каждый `.from('x')` в `src/` и `supabase/functions/` должен существовать как table/view в `src/integrations/supabase/types.ts`. Storage-бакеты (`signatures`, `images`, `manual_payment_proofs`, `intake-uploads`, …) в allowlist скрипта. |
| **Route drift** | константы `APP_ROUTES` (`src/lib/config/routes.ts`), которые нигде не используются. |
| **Module orphans** | файлы `src/components|hooks|lib`, которые никто не импортирует. |

## 2 · Состояние на 2026-08-28

| Метрика | Значение |
|---|---|
| Relations в схеме (tables + views) | 455 |
| Файлов просканировано | 2693 |
| DB drift | 16 (0 в активном money/lead-контуре) |
| Unused `APP_ROUTES` | 138 |
| Unimported modules | **0** (32 сироты удалены) |

## 3 · Закрытые разрывы

Созданы 8 отсутствовавших таблиц (RLS + GRANT + `updated_at`-триггеры), которые
код уже использовал:

`booking_payments` · `booking_vouchers` · `crm_web_form_submissions` ·
`crm_oauth_states` · `crm_nurture_queue` · `thai_partner_leads` ·
`offer_history` · `airport_passengers`

Прочее:
- `magnet-submit` читал несуществующий `nb_projects` → переведён на `property_projects`.
- `signatures` / `images` / `manual_payment_proofs` — это storage-бакеты, не таблицы (ложные срабатывания, внесены в allowlist).
- MC-справочник: анонимы больше не читают `management_companies`; публичные данные отдаёт вью `management_companies_public` (только маркетинговые колонки, `is_active = true`). Банковские/налоговые/Stripe-поля недоступны без входа.

## 4 · Остаточный DB drift (16)

**Архив (не деплоится, чистится вместе с `supabase/functions/_archive/`):**
`founder_daily_brief`, `outreach_messages` ×2, `mcc_campaign_rules`, `leads` ×2,
`user_analytics_daily` ×2, `cohort_analytics`.

**Активный код — требует решения продукта (создать relation или выпилить фичу):**

| Relation | Точка вызова | Комментарий |
|---|---|---|
| `lifeos_health_view` | `src/hooks/useLifeOSGovernance.ts:126`, `lifeos-ai-analyst:100` | LifeOS governance-панель, вью не создана |
| `v_outreach_messages_with_identity` | `src/hooks/useOutreachMessages.ts:36` | Outreach-модуль на паузе |
| `v_outreach_campaigns_unified` | `src/hooks/useOutreachMessages.ts:67` | то же |
| `owner_reports` | `export-mc-data:106`, `scheduled-mc-backup:56` | экспорт/бэкап MC частично пустой |
| `airport_booking_addons` | `notify-fasttrack-booking:171` | допуслуги трансфера не сохраняются |

Историческая оценка этих пяти путей как read-only с graceful degradation была неверной; актуальная сверка ниже.

## 5 · Удалённые сироты (32)

Home V1-остатки (`HeroIntro`, `PrimaryGrid`, `ClusterGrid`, `SectionHead`, `PopularTasks`,
`AudienceEntries`, `AllSectionsAccordion`, `TrustFooter`, `WhyChip`, `PersonaHalo`,
`PersonaPromptBanner`, `RealEstateEntry`, `FloatingConcierge`), PWA-дубли
(`FloatingInstallButton`, `QuickInstallButton`), `FloatingWhatsAppContact`,
`CommissionDisplay`, `NavChips`, `PaymentStageSelector`, `StaffTaskCalendar`,
хуки (`useCategories`, `useCityScopedQuery`, `useProviderCatalogCounts`,
`useProviderInputValidation`, `useSuperAppCatalog`, `usePopularTasks`,
`useClusterActivity`, `useCommissionRate`), либы (`generateCalendarEvent`,
`personaCanonicalMap`, `runtimePersonaCanonicalMap`, `personaBridge`).

## 6 · Правила поддержки

1. Новый `.from('x')` — только после миграции, создающей relation; иначе `--strict` падает.
2. Storage-бакеты добавляются в `STORAGE_BUCKETS` в скрипте, а не игнорируются молча.
3. Перед удалением модуля прогонять `npm run scan:architecture` — 0 сирот это baseline.
4. Новые top-level маршруты запрещены (см. `src/test/ia/no-orphan-top-level-routes.test.ts`).


## 7 · Сверка 2026-10-17: исходники и живой каталог

Проверка исходников выполнена для `0c7f027ee4529b117e0bd91891178b7d907db9d7`.
Read-only сверка живого каталога проверила 17 кандидатов: восемь отношений
присутствуют, девять отсутствуют. Это проверка существования отношений,
не проверка их данных, политик, бизнес-контрактов или развёрнутых обработчиков.

**Присутствуют:** `booking_payments`, `booking_vouchers`, `crm_nurture_queue`,
`crm_oauth_states`, `crm_web_form_submissions`, `airport_passengers`,
`offer_history`, `thai_partner_leads`.

**Отсутствуют как public relations:** `airport_booking_addons`, `images`,
`lifeos_health_view`, `manual_payment_proofs`, `nb_projects`, `owner_reports`,
`signatures`, `v_outreach_campaigns_unified`, `v_outreach_messages_with_identity`.

Эти девять не являются девятью подтверждёнными поломками:

- `images` вызывается через `supabase.storage` в
  `src/components/reviews/WriteReviewModal.tsx:81–87`;
  `signatures` — через storage в `src/hooks/useSignatureRequests.ts:102–106`;
  `manual_payment_proofs` — через storage в
  `src/components/admin/operations/OperationsManualPaymentsTab.tsx`.
  Это бакеты, а не таблицы. Существование бакетов в живом storage этой
  SQL-проверкой не подтверждалось.
- `nb_projects` больше не является активным обращением:
  `supabase/functions/magnet-submit/index.ts:126` читает `property_projects`.

### Активные разрывы и фактическое поведение

| Relation | Текущий путь | Последствие и следующий шаг |
|---|---|---|
| `airport_booking_addons` | `AirportFastTrackPage` вызывает `notify-fasttrack-booking`; обработчик вставляет дополнения после создания бронирования | Это **запись**, ошибка INSERT логируется, но ответ остаётся `success: true`. Нужен явный контракт сохранения дополнений, серверной цены и атомарности; не создавать таблицу по догадке. |
| `owner_reports` | `export-mc-data`, `scheduled-mc-backup` | Экспорт `reports` и `all` бросает ошибку и отвечает 500. Исходный планировщик игнорировал ошибки чтения, загружал неполный JSON и отмечал успех. Подготовлен кодовый барьер ошибок перед upload/last_backup_at с синтетической проверкой реального entrypoint; развёртывание этой правки не подтверждено. |
| `lifeos_health_view` | `useLifeOSGovernance.ts` → `LifeOSHealthTab`; `lifeos-ai-analyst` | Хук превращает ошибку в пустой массив; аналитик не проверяет ошибку и включает источник в список. Нужен проверенный контракт метрик и явное состояние недоступности, а не вымышленные показатели. |
| `v_outreach_messages_with_identity` | `useOutreachMessages.ts` → `OutreachHub.tsx:94` | Хук бросает ошибку, но экран использует только data/isLoading и отображает пустой фид. `/outreach` подключён в `AnimatedRoutes.tsx`; это активный маршрут, даже если исторически модуль назван приостановленным. |
| `v_outreach_campaigns_unified` | `useOutreachMessages.ts` → `OutreachHub.tsx:96` | Аналогично: отсутствие view скрывается пустыми кампаниями. Требуется явный контракт источников, компании, аудитории и прав для обоих outreach view. |

### Контракт резервного копирования остаётся открытым

`owner_reports` и `property_reports` не взаимозаменяемы.
Историческая миграция `20260225013744_18f6c3a0-c880-4cd3-b8d3-2a97388eacb8.sql`
задавала для owner_reports `company_id`, обязательный `title`, `file_url`,
nullable `property_id` с ON DELETE SET NULL.
Миграция `20260201161002_f294fb19-c369-43c6-9cea-03183c191ca6.sql`
задаёт для property_reports обязательный `property_id` с ON DELETE CASCADE,
`pdf_url`, `generated_by` и поля summary; company_id/title/file_url отсутствуют.
Тихая замена источника под прежним ключом `reports` меняет семантику экспорта.
Нужен явный выбор канонического набора и версии формата, проверка актуальной
схемы и потребителей восстановления; новый источник не подставлялся.

Дополнительный блокер RO-11 уже отражён в
`docs/convergence/e2_9/blockers-14.csv`: путь планировщика
`backups/${company.id}/...` расходится с проверкой company UUID в первом
сегменте storage-политики. Потребитель скачивания/восстановления облачного
бэкапа не доказан; `DataBackupSettings.tsx` скачивает ответ ручного экспорта.
Разрешения storage не ослаблялись.

Сверка не означает закрытие всего архитектурного плана. Отдельно остаются
проверка реальной сборки, маршрутов, UX, бизнес-процессов, прав, контрактов
данных и соответствия исходников развёрнутому приложению.


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

Все пять — read-only пути с graceful-degradation, не ломают платежи и лиды.

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

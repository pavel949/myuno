

# Детальный аудит блока Управляющей компании (`/mc`) как мини-ERP для агентства недвижимости на Пхукете

## Методология оценки

Система оценена по **12 критическим срезам ERP** для small-mid PM/RE агентства, со сравнением с лидерами (Guesty, Hostfully, Yardi, AppFolio, Argus, Pipedrive, Odoo Real Estate). Шкала 100 баллов в каждом срезе. Итоговая оценка = средневзвешенная.

---

## Что уже работает хорошо (сильные стороны)

| Срез | Что есть | Оценка |
|---|---|---|
| **Архитектура и каркас** | Sidebar 9 групп, 50+ маршрутов, MCGuard, ActiveCompanyProvider с invalidate cache при смене MC, RBAC через `useTeamPermissions`, мобильная навигация + FAB + Command Palette (⌘K) | **88** |
| **Multi-company изоляция** | Жёсткая изоляция через `activeCompanyId` на уровне хуков, переключатель компаний в header, server-resolved roles | **90** |
| **Объекты (Properties)** | 920 LOC OwnerProperties + PropertyManage + Wizard + Editor + Setup + Guidebook + Portal Settings + Inventory + Juristic + Documents | **85** |
| **Календарь & бронирования** | OwnerCalendar 259 LOC + MultiPropertyTimeline + AirbnbCalendarGrid + MCBookingsPage 461 LOC + BookingDetailSheet + iCal+OTA sync + ChannelHealth | **82** |
| **CRM** | 9 модулей: Contacts (722) + ContactDetail (1152) + Sales Pipeline + Pipelines (kanban) + Deals + Tasks + Sequences + Quotes + Meetings + Workflows + Web Forms + Duplicates + Templates + Assignment Rules | **84** |
| **Финансы (учёт)** | FinanceOverview + Transactions + Reports (5-step wizard, P&L, Owner Statement, Excel/PDF) + Budget + Invoices + Management Terms (revenue split, expense responsibility) | **78** |
| **Финансовое планирование** | DCF, IRR/NPV, Monte Carlo, Sensitivity, Portfolio Rollup, AI Advisor (Gemini), Investor Deck PDF | **82** |
| **Команда и доступы** | StaffPage 1008 LOC + permissions per module + activity log + onboarding sheet + role templates | **80** |
| **Дистрибуция / каналы** | Rentals United стратегия + iCal sync + OTA (Booking.com/Airbnb/VRBO/Agoda) + Sync Timeline + ConflictResolver + ChannelHealth | **76** |
| **Тарифы и pricing** | RateManagement 785 LOC: сезоны, multi-property, AI Pricing Suggestions, history через `property_activity_log` | **80** |

---

## Где критические пробелы и боль (требует доработки)

### 🔴 Критические (блокируют операции агентства)

| # | Пробел | Текущее | Лидер рынка | Приоритет |
|---|---|---|---|---|
| 1 | **Нет таблицы `owner_payouts`** — выплаты собственникам считаются в отчётах, но нет регистра выплат, статуса (pending/processed/paid), bank reference, batch payout runs | Только `vendor_payouts` для маркетплейса; `ManagementPortfolio` показывает только условия | Guesty/Hostfully: автогенерация owner statement → одной кнопкой batch payout через банк/Wise | **P0** |
| 2 | **Нет AR/AP (дебиторка/кредиторка)** — нет агрегированного балансового отчёта по контрагентам, нет aging report (30/60/90 дней), invoices не агрегируются по получателю | InvoicesPage — плоский список без contact rollup | Odoo/QuickBooks: AR Aging обязателен для PM-агентства | **P0** |
| 3 | **Отсутствует Trust Account / Escrow ledger** — депозиты гостей и owner funds должны храниться отдельно (требование Thai DBD для PM-агентств с >10 объектами) | `ledger_accounts` есть, но нет UI для escrow/trust segregation | AppFolio Trust Accounting — обязательная сертификация | **P0** |
| 4 | **Нет Owner Portal с pull-механизмом** для собственников: отчёты есть в `/my-property`, но нет approval flow по statement, нет e-sign договоров, нет messaging owner ↔ MC | Portal есть, но read-only | Guesty: owner просматривает отчёт → одобряет → подпись → выплата | **P0** |
| 5 | **Нет интеграции с Thai налоговой/withholding tax** (3% WHT, VAT 7%, PND 1/3/53) — нет генерации налоговых форм, нет автоматического расчёта в invoices | Поле currency/notes только | Региональная критика для Пхукета | **P0** |

### 🟡 Серьёзные (тормозят масштабирование)

| # | Пробел | Приоритет |
|---|---|---|
| 6 | **Нет Document Vault с e-sign**: договоры с собственниками, гостями, вендорами хранятся, но нет workflow подписания (DocuSign/PandaDoc) | P1 |
| 7 | **Нет workflow-движка для одобрений** (approval chains: расход >$X → апрув директора → бухгалтер → выплата) — есть Automation Rules, но без многоступенчатых approvals | P1 |
| 8 | **Слабая аналитика владения**: нет cohort report по собственникам (LTV, churn, NPS), нет owner profitability ranking, нет automated owner anniversaries/risk alerts | P1 |
| 9 | **Нет Resource Planning для команды**: нет shift schedule для уборщиц/maintenance, нет capacity planning, нет timesheet/payroll integration | P1 |
| 10 | **Procurement / supply chain**: Inventory есть, но нет purchase orders, нет re-order automation от vendor, нет 3-way match (PO ↔ delivery ↔ invoice) | P1 |
| 11 | **Slack/Teams/Telegram для команды**: уведомления в систему есть, но нет двусторонней интеграции с мессенджерами для оперативной работы | P1 |
| 12 | **Mobile-first для линейного персонала**: уборщицы/maintenance не имеют упрощённого PWA-режима с QR-входом на объект, чек-листами и фото-отчётом | P1 |

### 🟢 Желательные (UX/scale)

| # | Пробел | Приоритет |
|---|---|---|
| 13 | **Global search ⌘K** уже есть — но не покрывает финансовые транзакции, инвойсы, документы | P2 |
| 14 | **Saved views/filters** в списках бронирований, контактов, сделок, задач (как в Notion/Linear) | P2 |
| 15 | **Bulk actions** есть в SalesPipeline, но отсутствуют в Bookings/Contacts/Invoices/Tasks (массовые статусы, экспорт, теги) | P2 |
| 16 | **API / Zapier / Webhooks для UC** — нет публичного API для интеграций с банками, бухгалтерией, BI | P2 |
| 17 | **White-label storefront `/b/:slug`** существует, но нет full white-label настроек MC (свой домен, email-from, логотип в email/PDF) | P2 |
| 18 | **Onboarding в первый день** для новой MC: нет 7-step wizard "соберём вашу компанию за 30 минут" | P2 |
| 19 | **Sitemap/Information Architecture**: 9 групп с 50+ ссылками — нужен поиск по меню и "рекомендованные действия" в каждой группе | P2 |
| 20 | **Performance**: 233 компонента в `src/components/owner/`, 100+ страниц — нет page-level метрик (TTI, LCP) для MC, нет route-level chunking аудита | P2 |

---

## Итоговая оценка

| Срез ERP-системы | Балл (из 100) |
|---|---|
| 1. Архитектура и навигация | 86 |
| 2. RBAC и multi-tenancy | 88 |
| 3. Property management (объекты) | 84 |
| 4. Booking & calendar | 80 |
| 5. CRM & sales pipeline | 84 |
| 6. Financial accounting (учёт) | **62** ← AR/AP, owner payouts |
| 7. Financial planning (DCF/IRR) | 82 |
| 8. Reporting & BI | 75 |
| 9. Channel manager / distribution | 76 |
| 10. Team / HR / payroll | **55** ← нет shifts/timesheets |
| 11. Document & e-sign | **35** ← нет workflow подписания |
| 12. Compliance (Thai WHT/VAT/Trust) | **30** ← критично |

### **Итоговая взвешенная оценка: 71 / 100**

**Вердикт:** **сильный operational MVP** уровня Hostfully Lite — закрывает ~70% потребностей небольшого агентства Пхукета (5–30 объектов), но **5 критических P0-блоков** мешают позиционироваться как "полноценная мини-ERP с устойчивым масштабированием":
- Нет owner payouts регистра
- Нет AR/AP aging
- Нет Trust Account для соответствия Thai DBD
- Нет full 2-way Owner Portal с approvals
- Нет Thai tax compliance (WHT/VAT/PND)

---

## Roadmap → 90/100 (предлагаемый план поэтапной реализации)

**Фаза 1 — Финансовая полноценность (P0)** — выводит до **82/100**
1. Создать `owner_payouts` (миграция + UI + batch run + Wise/bank ref)
2. AR/AP Aging Dashboard (30/60/90 по контрагентам, цветовая шкала, drill-down)
3. Trust Account UI (escrow segregation в `ledger_accounts` + сводка балансов)
4. Thai Tax Engine: автоматический WHT 3%, VAT 7%, PND 1/3/53 в invoices/payouts + квартальные отчёты

**Фаза 2 — Owner Portal v2 (P0)** — выводит до **86/100**
5. Owner statement approval flow + signature (HTML drawing)
6. 2-way messaging owner ↔ MC внутри `/my-property`
7. e-Sign workflow для договоров (drawing signature → PDF lock → audit trail)

**Фаза 3 — Operational excellence (P1)** — выводит до **90/100**
8. Approval chains (workflow для расходов/закупок/контрактов)
9. Team shifts + timesheets + simplified mobile PWA для cleaners/maintenance с QR-входом
10. Procurement: PO → Delivery → Invoice (3-way match)
11. Owner cohort analytics (LTV, churn, satisfaction, profitability)

---

## Технические детали реализации

**База данных:**
- `owner_payouts` (id, owner_id, mc_id, period_start/end, gross, commission, expenses, net, status enum, bank_ref, paid_at, statement_url)
- `payout_runs` (batch processing)
- `ar_aging_view` (computed view: 0-30/31-60/61-90/90+)
- `trust_accounts` (segregated balances)
- `tax_filings` (WHT/VAT/PND records)
- `signature_requests` (e-sign workflow)
- `approval_workflows` + `approval_steps`

**Edge functions (новые):**
- `process-owner-payout-batch` (Wise API integration)
- `generate-thai-tax-report`
- `request-signature` (drawing-based, без DocuSign)

**UI (новые страницы):**
- `/mc/finance/owner-payouts`
- `/mc/finance/ar-aging`
- `/mc/finance/trust-accounts`
- `/mc/finance/tax-center`
- `/mc/team/shifts`
- `/mc/documents/signatures`
- `/mc/approvals`

**Подход:** реализовать поэтапно, каждая фаза = 1–2 сессии. Начать с Фазы 1 (финансы P0) как наибольший gap-to-leaders.


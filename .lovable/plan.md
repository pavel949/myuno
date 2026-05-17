# План: полный аудит дубликатов myUNO

Аудит **только на чтение**. Никаких правок кода/БД в этом проходе — на выходе отчёт + ранжированный список рекомендаций. Решение по каждому пункту примешь ты, потом отдельным заходом будем чистить волнами.

## Что уже видно из быстрого скана (предварительные находки)

### 1. Дубликаты страниц/лендингов (код)
- **3 главные:** `src/pages/Index.tsx`, `IndexLegacy.tsx`, `IndexSimplified.tsx` — нужен один.
- **Два каталога лендингов:** `src/pages/landing/` (4 файла, старая система) vs `src/pages/landings/` (новая, Magnet/Cluster/Persona). Сейчас сосуществуют.
- **Пересекающиеся системы лендингов:**
  - `mcc_landing_registry` (5 записей) — старая Marketing Command Center
  - `magnet_landings` (0 записей) — новый визуальный билдер магнитов (только что сделали)
  - `personaLandings.ts` / `areaLandings.ts` / `clusterLandings.ts` — code-generated
  - Жёсткие `*Landing.tsx` файлы по вертикалям (~25 шт.)
  → как минимум 4 параллельные системы лендингов делают одно и то же.
- **8 пар компонентов с одинаковыми именами** в разных папках: `TaskDetailSheet`, `ReferralCard`, `PricingStep`, `PhotosStep`, `PageHeader`, `EmptyState`, `CancellationPolicySelector`, `BasicInfoStep`.

### 2. Дубликаты роутов
- В `AnimatedRoutes.tsx` путь `"projects"` объявлен дважды (строки 363 и 684): `DeveloperProjects` и `CapitalProjects`. Один точно затирает другой в своём parent-роуте — нужно проверить, к каким родителям прибиты.

### 3. Дубликаты хуков-«лидов»
В `src/hooks/`: `useLeadConfigs`, `useLeadHub`, `useLeadMagnets`, `useLeadsFactory`, `useUniversalLead`, `useTeamLeads`, `useNewbuildLeads`, `useUnifiedContact`, `useCrmContacts` — **9 хуков**, частично перекрывающихся (Universal vs Factory vs Hub).

### 4. Дубликаты в БД (данные)
- **`crm_contacts` по email:** найдено 5 групп дубликатов (matthenss@me.com — 3 раза, pavel@ignatevestate.com — 2 и т.д.). UNIQUE индекса нет.
- **Параллельные таблицы лидов:** `consultation_requests` (9), `lead_magnet_submissions` (0), `mcc_leads` (0), `nb_leads` (4) — четыре «свалки» под лиды.
- **Параллельные таблицы недвижимости:** `properties` (32), `listings` (500), `owner_properties` (32), `inventory_listings` (0), `business_listings` (0).
- **Vendors:** `providers` (48) vs `marketplace_vendors` (36) — известное двойное хранение.

### 5. Hub vs Index дубли
`property/PropertyHub.tsx` + `property/PropertyIndex.tsx`, `knowledge/KnowledgeHub.tsx` + `KnowledgePillarsIndex.tsx`, `team/TeamContentHub.tsx` + другие — формально разные, но часто решают одну задачу.

---

## Что сделает аудит-проход

| Wave | Что проверяю | Метод |
|---|---|---|
| **A. Код-дубли** | Identical-by-name components (8 пар), Index*.tsx, landing/ vs landings/, осиротевшие импорты | `rg`, AST-сравнение по shape (имена пропсов/строк), git-blame для давности |
| **B. Хуки** | 9 lead-хуков: какие где импортируются, какой реально вызывает БД, какие — обёртки | `rg "from '@/hooks/useLead"` + список call sites |
| **C. Роуты** | Дубли `path=`, конфликты родителей, мёртвые роуты без линков | Парс `AnimatedRoutes.tsx` + `APP_ROUTES`, проверка ссылок |
| **D. Лендинг-системы** | 4 параллельные системы (mcc_landing_registry / magnet_landings / personaLandings.ts / hardcoded *Landing.tsx) — кто живой, кто мёртвый, что лучше консолидировать | SQL counts + git activity + рендер-карта |
| **E. БД: контакты/лиды** | Дубли в `crm_contacts`, `consultation_requests`, `providers` ↔ `marketplace_vendors` по email/phone/name | SQL GROUP BY + similarity (Levenshtein на name) |
| **F. БД: недвижимость** | `properties` vs `listings` vs `owner_properties` — overlap по external_id/title/location | SQL + проверка FK |
| **G. Технические таблицы** | Пустые/осиротевшие таблицы (тех. долг из Cleanup Roadmap 2026-Q2) | информация из `docs/cleanup/CLEANUP_ROADMAP.md` + текущий counts |

## Формат отчёта (`/mnt/documents/duplicates-audit.md`)

Для каждой находки:
- **ID** (например `DUP-CODE-01`)
- **Что**: ссылка на файлы/таблицы
- **Серьёзность**: 🔴 high (ломает) / 🟡 medium (тех. долг) / 🟢 low (косметика)
- **Доказательство** (counts, конкретные строки)
- **Рекомендация** (что оставить, что удалить, что смержить)
- **Риск удаления** (что сломается)

Плюс **топ-10 «убить первым»** — с явной приоритизацией.

## Что НЕ делаю в этом проходе
- Не правлю код.
- Не удаляю таблицы/строки.
- Не сливаю CRM-контакты (это отдельная операция через `useDetectDuplicates` / `detect-crm-duplicates` edge fn, которые уже есть).
- Не трогаю `magnet_landings` (только что построили — даём ему время наполниться).

## Рекомендую: начать с этого аудита
Это даёт цельную картину за один проход (~10–15 минут работы) и материал для волн чистки. Альтернативы — точечно по одному типу — растянут процесс на несколько итераций без общей карты.

После твоего «ок» — запускаю аудит и кладу отчёт в `/mnt/documents/duplicates-audit.md`.

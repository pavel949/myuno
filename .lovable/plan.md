

## Аудит соответствия кода DESIGN_BIBLE v1.2

Сравнил `DESIGN_BIBLE_2.md` (canonical, v1.2) с фактическим кодом: `src/styles/tokens.css`, `tailwind.config.ts`, `index.html`, `src/design-system/tokens.json`, и точечно компоненты.

### ✅ Что соответствует

| Область | Статус |
|---|---|
| **Шрифты** (Golos Text · DM Sans · JetBrains Mono · Playfair Display · Sarabun) | Загружены в `index.html`, замаплены в `tailwind.config.ts` ✅ |
| **Background** `#08101E`, **Card** `#162236`, **Card-elevated** `#1E2D45` | Совпадают ✅ |
| **Primary mint** `#00D68F` (157 100% 42%) | Совпадает ✅ |
| **Accent blue** `#4E7BFF` (224 100% 65%) | Совпадает ✅ |
| **Foreground** `#EDF2FF`, **muted-foreground** `#8FA3B8` | Совпадают ✅ |
| **Cluster токены существуют** (`--cluster-arrive/live/legal/invest/manage/build`) | Есть ✅ |
| **Light mode** через `html.light` | Реализован ✅ |
| **Radius** `--radius: 16px` | Соответствует card `rounded-md` ✅ |

### ❌ Расхождения (требуют исправления)

#### 1. Cluster-цвета НЕ совпадают с Bible §7.4

Bible требует **закреплённые навсегда** значения, но в коде:

| Cluster | Bible требует | Код (dark) | Статус |
|---|---|---|---|
| `arrive` | `#00D68F` (mint) | `157 100% 42%` ✅ | OK |
| `live` | `#4E7BFF` (blue) | `224 100% 65%` ✅ | OK |
| `legal` | `#F59E0B` (amber) | `38 92% 50%` ✅ | OK |
| `invest` | `#A78BFA` (фиолетовый светлее) | `270 60% 60%` ❌ темнее | расхождение |
| `manage` | `#16BDCA` (cyan-teal) | `190 80% 55%` ❌ другой hue | расхождение |
| `build` | `#EF4444` (красный) | `0 80% 60%` ❌ ярче | расхождение |

Light mode cluster колоризация полностью переназначена (live=amber, legal=blue и т.д.) — **прямое нарушение R7.4 «закреплены навсегда»**.

#### 2. Дублирующая dual toast-система (нарушение R13.9.1)

В коде существуют одновременно:
- `src/components/ui/sonner.tsx` (canonical)
- `src/components/ui/toast.tsx` + `toaster.tsx` (Radix — должен быть удалён, AUDIT #14, #20)

#### 3. Устаревший DS2.0 «Navy Premium» не удалён

`src/design-system/tokens.json` всё ещё содержит «Navy Premium» спецификацию (`"$schema": "myUNO DS2.0 — Navy Premium"`). Bible §0 явно **отменяет** этот файл.

#### 4. Hardcoded HEX `#08101E` в компонентах (нарушение §7.8 / Hard rule §1.5.3)

Минимум в 5 файлах:
- `src/components/home/ConciergeCard.tsx`
- `src/components/home/HomeTopBar.tsx`
- `src/components/home/RoleSheet.tsx` (×2)
- `src/components/home/SignalStack.tsx`

Должно быть `text-background` или `text-[hsl(var(--primary-foreground))]`.

#### 5. Отсутствуют semantic tokens из Bible §7.2

В `tokens.css` нет:
- `--foreground-secondary` (`#C4D0E0`, 214 33% 82%)
- `--disabled-foreground` (`#5A6A80`)
- `--inset` (`#0C1827`) для inset sections
- `--popover` (`#1A2941`) — есть, но другое значение (`#162236`)
- `--primary-muted`, `--accent-muted`, `--success-muted`, `--warning-muted`, `--destructive-muted` (rgba 0.15)
- `--border-accent` (`rgba(0,214,143,0.4)`)
- `--glass-light/medium/strong`, `--overlay-dark/darker`

#### 6. Success-цвет почти совпадает с primary (нарушение R7.4 «different hue from primary»)

Bible: `--success: #2D9966` (152 58% 42%)
Код: `--success: 152 58% 42%` ✅ совпадает — **OK** (ложная тревога, проверил повторно).

Но в light mode `--success: 142 72% 36%` (`#16a34a`) — соответствует Bible §7.3 ✅.

#### 7. Тень/glow используют mint correctly, но `--shadow-card` в коде слабее

Bible требует glow component `rgba(0,214,143,0.04)` для level 2; в коде glow начинается только с elevation-3.

#### 8. Typography масштаб не задан как утилитные классы

Bible §8.4 определяет `display-lg`, `heading-lg`, `body-lg`, `caption`, `overline`, `mono-lg` и т.д. В `tailwind.config.ts` этих классов **нет** — используются raw `text-2xl font-bold`. Это допустимо, но контракт-уровень спецификации требует именованных tokens.

### План работ (после approve, в default mode)

**Pass A — критичные правки токенов (1 файл):**
1. Обновить `src/styles/tokens.css`:
   - Перенастроить cluster colors dark+light на канонические из §7.4 (`#A78BFA`, `#16BDCA`, `#EF4444`)
   - Добавить недостающие `--foreground-secondary`, `--disabled-foreground`, `--inset`, `--*-muted`, `--border-accent`, `--glass-*`, `--overlay-*`
   - Поправить `--popover` на `#1A2941`

**Pass B — удаление мёртвой спецификации:**
2. Удалить `src/design-system/tokens.json` (DS2.0 Navy) и проверить imports
3. Удалить `src/components/ui/toast.tsx` + `toaster.tsx` если нет live usages; иначе сделать их thin wrapper над sonner

**Pass C — компоненты:**
4. Заменить hardcoded `text-[#08101E]` на `text-background` / `text-[hsl(var(--primary-foreground))]` в 5 файлах home/

**Pass D — Tailwind typography tokens (опц., более крупная):**
5. Добавить в `tailwind.config.ts` semantic font-size keys из Bible §8.4

### Технические детали
- Все правки HSL-формат (`H S% L%`) — Tailwind compatibility
- Light mode правится синхронно с dark
- Toast removal требует grep по `useToast`, `Toaster` импортам перед удалением
- Hardcoded hex замена — простой find/replace без логических изменений

**Вне scope этого аудита:** RLS policies (§20), routing (§3.2), guard-pattern (§5.3) — отдельные крупные блоки, требуют свой audit pass.


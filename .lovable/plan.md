
# Аудит модуля управления недвижимостью Owner

## Резюме текущего состояния

### ✅ Что реализовано хорошо

#### 1. Учёт расходов и чеков
| Функция | Статус | Детали |
|---------|--------|--------|
| Быстрый расход (QuickExpense) | ✅ Отлично | Мобильно-адаптированная форма с фото чека, быстрыми суммами, привязкой к объекту |
| OCR распознавание | ✅ Работает | `ReceiptUploadWithOCR.tsx` — AI (Gemini) извлекает сумму, дату, вендора, категорию |
| Просмотр чеков | ✅ Есть | `ReceiptViewer` — просмотр прикреплённых чеков в финансах |
| Категории расходов | ✅ Детальные | EXPENSE_CATEGORIES включает: уборка, ремонт, коммуналка, страховка и др. |
| Экспорт CSV | ✅ Работает | Кнопка экспорта в `OwnerFinancials.tsx` |

#### 2. Делегирование и второй хозяин (Co-Host)
| Функция | Статус | Детали |
|---------|--------|--------|
| Система делегирования | ✅ Полная | Таблица `property_delegates` с 4 ролями |
| Роли | ✅ Airbnb-уровень | trustee, agent, manager, management_company |
| Гранулярные права | ✅ Реализованы | view, edit, financials, bookings, maintenance |
| Приглашения | ✅ Работают | `InviteTeamMemberDialog` — 3-шаговый визард |
| Принятие/отклонение | ✅ Есть | `useAcceptInvitation`, `useRevokeDelegate` |
| Передача права собственности | ✅ Есть | `useTransferOwnership` — полный transfer workflow |

#### 3. OTA-синхронизация (iCal)
| Функция | Статус | Детали |
|---------|--------|--------|
| Импорт из OTA | ✅ Работает | iCal-ссылки с Airbnb, Booking, VRBO |
| Автосинхронизация | ✅ Есть | Edge Function `ical-sync`, 15-минутный интервал |
| Экспорт на OTA | ✅ Работает | `useICalExportUrl` с ротацией токенов |
| Channel Manager | ✅ Визуальный | 4 вкладки: Health, Import, Export, History |
| Обнаружение конфликтов | ✅ Есть | `ConflictResolver` компонент |
| Статус здоровья | ✅ Dashboard | `ChannelHealthDashboard` с метриками |

#### 4. Отчёты
| Функция | Статус | Детали |
|---------|--------|--------|
| Генерация отчётов | ✅ Работает | Ежемесячные, квартальные, годовые |
| Содержание отчёта | ✅ Детальное | Доходы, расходы, occupancy, bookings, maintenance |
| Фильтр по объекту | ✅ Есть | Выбор конкретного property |
| Произвольный период | ✅ Есть | Custom date range |

---

## ⚠️ Выявленные пробелы

### 1. Маркетинг и продвижение объектов
**Статус: НЕ РЕАЛИЗОВАНО**

У владельцев отсутствует блок для маркетинга/продвижения:
- Нет "Boost Listing" функционала
- Нет статистики просмотров листинга
- Нет рекомендаций по улучшению объявления
- Нет интеграции с динамическим ценообразованием
- Нет сравнения с конкурентами

### 2. Отчёты для управляющих vs собственников
**Статус: ЧАСТИЧНО**

Текущие отчёты одинаковы для всех ролей:
- Нет разделения отчётов по ролям (owner vs manager)
- Нет автоматической рассылки отчётов владельцу
- Нет PDF-генерации (поле есть, но не заполняется)
- Нет white-label отчётов для УК

### 3. UX улучшения в финансах
**Статус: МОЖНО УЛУЧШИТЬ**

- Нет drag-and-drop для фото чеков
- Нет автозаполнения на основе истории
- Нет голосового ввода расходов
- Нет интеграции с банковскими выписками

---

## План улучшений

### Фаза 1: Маркетинговый блок для владельцев (2-3 дня)

**1.1 Создать страницу "Продвижение объекта"**
```
src/pages/owner/PropertyMarketing.tsx
```

Функционал:
- Статистика просмотров (views, clicks, conversion)
- Анализ листинга (checklist качества)
- Рекомендации AI по улучшению описания/фото
- Сравнение с похожими объектами (benchmark)
- Кнопка "Boost" для Featured-размещения

**1.2 Компоненты маркетинга**
```
src/components/owner/marketing/
├── ListingHealthScore.tsx      # Оценка качества листинга
├── ViewsAnalytics.tsx          # Статистика просмотров
├── CompetitorBenchmark.tsx     # Сравнение с рынком
├── AIListingOptimizer.tsx      # AI-рекомендации
├── BoostListingCard.tsx        # Платное продвижение
└── DynamicPricingCard.tsx      # Рекомендации по ценам
```

**1.3 Схема данных**
```sql
-- Статистика просмотров
CREATE TABLE property_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES owner_properties(id),
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  search_impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Платные буст-кампании
CREATE TABLE property_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES owner_properties(id),
  promotion_type TEXT NOT NULL, -- 'featured', 'boost', 'highlight'
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'THB',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Фаза 2: Улучшение отчётности (1-2 дня)

**2.1 Разделение отчётов по ролям**

Для **владельца**:
- Полный финансовый отчёт
- ROI и сравнение с прошлыми периодами
- Автоматическая email-рассылка

Для **управляющего**:
- Операционный отчёт (bookings, maintenance)
- Доступ к финансам только при наличии прав

**2.2 PDF-генерация**
```typescript
// Edge Function: generate-report-pdf
// Использует Puppeteer/Playwright для генерации PDF
// Сохранение в Supabase Storage
```

**2.3 Автоотправка отчётов**
```sql
-- Настройки автоотправки
ALTER TABLE owner_properties 
ADD COLUMN report_frequency TEXT DEFAULT 'monthly',
ADD COLUMN report_recipients TEXT[] DEFAULT '{}',
ADD COLUMN auto_report_enabled BOOLEAN DEFAULT false;
```

### Фаза 3: UX-улучшения финансов (1 день)

**3.1 Drag-and-drop чеки**
- Обновить `DocumentUpload` для поддержки drag-and-drop на мобильных

**3.2 Автозаполнение**
- Сохранять последние вендоры/категории
- Предлагать на основе истории

**3.3 Голосовой ввод**
- Интеграция Web Speech API для описания расходов

---

## Техническая архитектура

### Маршруты для маркетинга
```typescript
// В AnimatedRoutes.tsx
<Route path="properties/:id/marketing" element={<LazyPage><PropertyMarketing /></LazyPage>} />
```

### Хуки для аналитики
```typescript
// src/hooks/usePropertyAnalytics.ts
export function usePropertyAnalytics(propertyId: string) {
  // Статистика просмотров за период
}

export function useListingHealthScore(propertyId: string) {
  // Оценка качества листинга (0-100)
  // Чеклист: фото, описание, цены, amenities, отзывы
}

export function usePropertyPromotions(propertyId: string) {
  // Активные буст-кампании
}
```

### Интеграция в PropertyManage
```
src/components/owner/property-manage/
├── index.ts (существует)
├── ListingSection.tsx (существует)
├── CalendarSection.tsx (существует)
├── PricingSection.tsx (существует)
├── RulesSection.tsx (существует)
└── MarketingSection.tsx (НОВЫЙ) ← Добавить вкладку "Продвижение"
```

---

## Итоговая оценка

| Область | Текущий статус | После улучшений |
|---------|---------------|-----------------|
| Расходы/Чеки | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐⭐ |
| Co-Host/Делегирование | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐⭐ |
| OTA-синхронизация | ⭐⭐⭐⭐☆ (4/5) | ⭐⭐⭐⭐⭐ |
| Отчёты | ⭐⭐⭐☆☆ (3/5) | ⭐⭐⭐⭐⭐ |
| Маркетинг | ☆☆☆☆☆ (0/5) | ⭐⭐⭐⭐☆ |

### Ключевые выводы

**Сильные стороны:**
1. QuickExpense — отличный mobile-first UX для записи расходов
2. OCR чеков — автоматическое распознавание через AI
3. Делегирование — полноценная система как в Airbnb
4. iCal Channel Manager — профессионального уровня

**Критические пробелы:**
1. **Маркетинг** — владельцы не могут продвигать объекты
2. **PDF-отчёты** — нет реальной генерации PDF
3. **Email-рассылка** — нет автоматической отправки отчётов

**Рекомендация:** Приоритетно реализовать маркетинговый блок, так как это напрямую влияет на привлечение гостей и доход владельцев.

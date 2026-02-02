
# План: Unified Lead System (Единая система лидов по вертикалям)

## ✅ Фаза 1: ВЫПОЛНЕНО

### Реализованные компоненты:

| Файл | Статус | Описание |
|------|--------|----------|
| `migration` | ✅ | Добавлены vertical_id, vertical_metadata, entry_point, lead_source |
| `src/lib/leadVerticalConfig.ts` | ✅ | Конфиг 12 вертикалей с динамическими полями |
| `src/components/fab/UniversalHelpFAB.tsx` | ✅ | Глобальная FAB-кнопка |
| `src/components/leads/UniversalLeadForm.tsx` | ✅ | Многошаговая форма |
| `src/components/leads/VerticalCTA.tsx` | ✅ | CTA с 5 вариантами |
| `src/hooks/useUniversalLead.ts` | ✅ | Хук для сабмита |

---

## ✅ Фаза 2.1: VerticalCTA на страницах (ВЫПОЛНЕНО)

| Страница | Vertical | ✓ |
|----------|----------|---|
| /yachts | yachts | ✅ |
| /tours | tours | ✅ |
| /transport | vehicles | ✅ |
| /legal | legal | ✅ |
| /fitness | gyms | ✅ |
| /medical | clinics | ✅ |
| /babysitter | babysitters | ✅ |
| /beauty | salons | ✅ |
| /restaurants | restaurants | ✅ |
| /water | water_sports | ✅ |

---

## ✅ Фаза 2.2: Admin Lead Hub (ВЫПОЛНЕНО)

- ✅ Фильтр по vertical_id в `/admin/consultations`
- ✅ Фильтр по lead_source (fab/cta/organic/chat/external)
- ✅ Отображение вертикали и источника на карточках лидов

---

## ✅ Фаза 3: AI & Automation (ВЫПОЛНЕНО)

- ✅ AI Lead Scoring (edge function `leads-factory`)
- ✅ Batch scoring (кнопка AI-скоринг в админке)
- ✅ WhatsApp/Email follow-up генератор
- ✅ AI Insights в карточках лидов (score, priority, reasoning)
- ✅ FollowUpGenerator с копированием и открытием мессенджеров

---

## 📋 Фаза 4: Future Enhancements (TODO)

- Telegram Bot интеграция
- Smart Suggestions (на основе истории просмотров)
- AI Auto-routing по вертикалям (назначение менеджеров)
- Расширенная аналитика по вертикалям

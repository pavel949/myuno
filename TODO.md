# Marketplace discovery extension

- [x] Provider offers: записанные фото с fallback, рейтинг и реальные review_count провайдера, цены с исходной валютой и единицей тарифа, ссылки профиля и существующая безопасная заявка.
- [x] URL-фильтры по точному району услуги, дате, min/max цене, валюте и доступности сегодня; отличимые loading/error/unknown/empty.
- [x] Read-only availability в timezone Пхукета, concurrency ≤4, без обещания подтверждённой брони.
- [x] «Популярно сейчас» по записанным review_count и рейтингу, с явным критерием и без дублей.
- [x] Concierge fallback с запросом, returnTo и фильтрами, включая отсутствие/ошибку графика в booking sheet; без второго order writer.
- [x] Live anonymous public API проверка projection shape: HTTP 200. Исправлен старый public join, который требовал непустой embedded provider.
- [ ] Реальное provider supply: среди 33 active/approved service rows, связанных с 14 provider IDs, public_provider_catalog не вернул ни одного соответствующего публичного профиля. Нужна проверка публикации/модерации/видимости реальных провайдеров в Lovable Cloud, без слепого ослабления RLS.

Доказательства: 117 regression tests и 8 RU/EN browser cases (375/390/430/1280) прошли. TypeScript, ESLint changed files, production build и design gate проверены; повтор type/build после финального live-join fix — release gate. Reader ограничен 60 последними active/approved services. Категории/ситуации шаблонов и provider offers остаются явно разными представлениями до проверенного domain mapping. Synthetic UI fixtures не являются реальным предложением или demand evidence.

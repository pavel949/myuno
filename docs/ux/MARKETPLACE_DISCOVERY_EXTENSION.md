# Расширение marketplace discovery

## Контракт и источники

Предложения остаются проекцией `public_service_catalog`. Trust metadata читаются из `public_provider_catalog`: demo-провайдеры исключаются, ошибка этой проверки закрывает каталог с retry, а не обходит trust-фильтр. Контакты, финансы и private provider records не читаются. Карточки показывают только записанные фото, цену с исходной валютой и единицей тарифа, рейтинг и число отзывов провайдера. При отсутствии фото/рейтинга/цены отображаются явные неизвестные значения. Район берётся только из `locations.district`: provider coverage_areas не подменяет точную локацию услуги.

## Фильтры и UX

Район, дата, минимальная/максимальная цена, валюта и «сегодня» хранятся в URL, сохраняют неизвестные query-параметры и router state. Явно выбранная валюта фильтрует даже без границ цены. Сырые суммы разных валют не смешиваются; конвертация не производится. Неизвестная цена исключается только при активной границе цены. Невалидная дата/валюта или диапазон fail closed с пояснением.

Доступность даты — read-only пересчёт существующих `provider_availability` и `get_provider_busy_slots` в часовом поясе Asia/Bangkok с записанными duration_minutes и lead_time_hours. Отсутствующие параметры или отсутствие расписания дают UNKNOWN. Ошибки API также не дают AVAILABLE, но имеют отдельную error metadata, alert и retry. Каждый провайдер проверяется один раз за запрос, concurrency ≤4, refresh наблюдаемого запроса каждые 30 секунд. Свободный слот — возможность запроса, не подтверждённая бронь и не inventory hold. При заказе существующий server writer остаётся окончательным источником истины.

Живые предложения размещены перед справочником категорий. Первоначальная выдача ограничена восемью обычными карточками плюс popular selection; остальные раскрываются кнопкой. В существующем reader сохраняется верхний предел 60 последних опубликованных предложений: это ограниченная подборка, не полный индекс всех услуг. На границе лимита интерфейс сообщает об этом. Availability проверяется для загруженной подборки, без запросов private inventory.

Категории/ситуации существующего каталога и provider offers пока имеют разные проверенные контракты. При совместном URL фильтры района/даты/цены остаются сохранёнными, но явно отмечены неактивными для request templates. Кнопка перехода к provider offers убирает category/type/home/situation и сохраняет остальные условия. Связи с отраслью не выводятся из названий услуг. Независимые provider offers остаются читаемыми при ошибке справочника taxonomy.

## Популярность и concierge

«Популярно сейчас» использует положительный записанный review_count и валидный рейтинг из public_provider_catalog; критерий по отзывам провайдеров указан явно. Это не статистика live спроса или заказов. При отсутствии доказательств блок не показывается. Карточки selection не дублируются в обычной выдаче.

Concierge — существующий `ConciergeHelpSheet` с запросом, returnTo и фильтрами. Fallback доступен при отсутствии подходящих предложений, ошибке каталога и отсутствии/ошибке графика в booking sheet. Новый service order writer не создаётся. Если найдено структурированное предложение, handoff возвращает клиента в canonical service workflow; это указание менеджеру, не новый автоматический backend bridge.

## Разделение файлов

`hooks/useServiceMarketplace.ts` читает публичные service/provider/location поля; `hooks/useMarketplaceAvailability.ts` — read-only availability. Pure фильтры и ранжирование находятся в `lib/services/marketplaceDiscovery.ts`, проверка графиков — в `marketplaceAvailability.ts`. `MarketplaceServiceCard`, `MarketplaceFilters` и `MarketplaceServiceGrid` отвечают за представление. `ServicesIndex` связывает каталог и concierge.

Production schema, RLS, money writers и inventory mutations не меняются. Synthetic UI fixtures не доказывают наличие provider supply на production. Supabase connector текущей сессии не содержит production проекта, но read-only anonymous REST проверка с публичной конфигурацией приложения выполнена через `scripts/qa/marketplace-public-contract.mjs`.

На 2026-11-14 11:07 UTC public_service_catalog вернул 33 active/approved services, связанных с 14 provider IDs. Вложенный provider JSON отсутствует у всех 33 строк; ошибочный старый `.not('provider','is',null)` заменён на проверку provider_id, а имя/рейтинг/verified/review_count собираются из public_provider_catalog. Для этих 14 IDs публичная проекция провайдеров вернула 0 строк, поэтому допустимых live non-demo offers сейчас 0. Это не доказательство, что все 14 demo: статус скрытых строк неизвестен. Нужна проверка публикации/модерации/публичной видимости реальных provider profiles в Lovable Cloud. Заполнять пробел synthetic supply или ослаблять RLS вслепую нельзя.

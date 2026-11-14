# Marketplace: карточки предложений, фильтры и concierge

Дата: 14 ноября 2026. Проверка live public API: 11:07 UTC.

## Реализованные изменения

Опубликованные services читаются из `public_service_catalog`, а публичные provider profiles — из `public_provider_catalog`. Карточка показывает записанные фото, исходную цену/валюту/единицу тарифа, исполнителя, его рейтинг и review_count, verification badge только при явном true и точный район услуги. Недоступные фотографии и отсутствующие данные имеют явный fallback, без выдуманных цен, отзывов и stock-предложений.

Живые карточки размещены выше справочника категорий. «Популярно сейчас» использует положительные записанные review_count и корректные provider ratings с подписью критерия. Это не статистика текущего спроса или заказов. Без доказательств популярности блок скрыт. Selection не дублируется ниже; первоначально показываются восемь обычных карточек с кнопкой раскрытия.

Район, дата, min/max price, валюта и «сегодня» сохраняются в URL вместе с returnTo и router context. Валюта работает самостоятельно, без границы цены. Суммы разных валют не сравниваются без конвертации. Район — записанный `locations.district`, а не coverage area провайдера.

Доступность рассчитывается по публичному расписанию и существующему busy-slot RPC с реальной длительностью, lead time и временем Пхукета. Проверка read-only, до четырёх провайдеров одновременно, с обновлением наблюдаемого запроса каждые 30 секунд. Неполный график не становится «свободно»; ошибка API показана отдельно с retry. Слот — возможность отправить заявку, не подтверждённая бронь. Дата передаётся в существующий booking sheet; серверный order writer не меняется.

При отсутствии подходящих предложений, ошибке каталога или отсутствии/ошибке расписания доступен существующий concierge workflow. Форма получает запрос, URL и фильтры. Второй order writer не создаётся. Категории/ситуации request templates пока не сопоставлены с provider offers проверенным контрактом: в совместном URL фильтры предложений явно отмечаются неактивными для шаблонов и сохраняются при переходе к provider offers.

## Реальные production findings

Anonymous REST endpoints отвечают HTTP 200 и принимают новые поля и location embedding. В active/approved service projection сейчас **33 услуги**, связанные с **14 provider IDs**. Вложенный `provider` отсутствует у всех 33 строк. Старый reader скрывал такие услуги из-за `.not('provider','is',null)`; дефект исправлен проверкой provider_id и join с публичной provider projection.

Однако `public_provider_catalog` не возвращает ни одного из этих 14 IDs публичному посетителю. Поэтому **допустимых live non-demo предложений сейчас 0**. Это не означает, что все 14 провайдеров demo: их внутренние статусы неизвестны. Нужна проверка публикации, модерации и публичной видимости связанных профилей в Lovable Cloud. Private provider records не читались; demo/public flags не менялись, RLS не ослаблялась и фиктивные предложения не добавлялись.

**До публикации реальных provider profiles production будет показывать concierge fallback, а не искусственный marketplace.** Для настоящих карточек нужны одобренные публично видимые non-demo профили с услугами, фото, географией, тарифами и графиком. Для «Популярно сейчас» нужны реальные reviews/rating. Проверка реальных слотов на eligible provider остаётся post-publication check.

## Итоговые проверки

| Проверка | Результат |
|---|---|
| Regression suite на финальном public-join исправлении | 117/117, 10 файлов |
| RU/EN browser matrix: 375, 390, 430, 1280 px | 8/8 |
| Browser assertions | Фото/fallback, валюта цены, URL persistence, дата, today toggle, handoff даты, concierge, отсутствие overflow, controls ≥44 px |
| TypeScript после последнего исправления | Прошёл |
| ESLint изменённых файлов | Без ошибок и предупреждений |
| Design-system gate | 0 новых/структурных findings; старый backlog не объявляется устранённым |
| Production build после последнего исправления | Прошёл; сохраняется существующее предупреждение о крупных chunks |
| Anonymous live projection contract | HTTP 200; shape проверена, eligible offers = 0 |

Browser tests использовали явно synthetic данные и блокировали production network. Заказы, платежи и заявки не отправлялись. Live API check читает bounded public projections и выводит агрегаты без имён, контактов или credential values.

## Ограничения и release

Reader сохраняет предел 60 последних active/approved service rows; после trust filtering подборка может быть меньше. Это ограниченная подборка, не полный поисковый индекс; дополнительный подбор доступен через concierge. При отображаемом достижении лимита UI сообщает о нём. Полноценный автоматический concierge→booking bridge и real-time demand ranking не добавлялись.

Новых миграций или edge deployments нет. Push в main запускает обычный Vercel pipeline, но сам push не доказывает READY deployment на custom domain. Rollback — revert marketplace feature commit, без изменений RLS и money writer.

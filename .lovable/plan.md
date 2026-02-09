

# Очистка каталога и расширение портфеля Experiences

## 1. Найденные дубликаты (для деактивации)

### Experiences (8 пар дублей)
| Название | Оставить ID | Деактивировать ID |
|----------|------------|-------------------|
| James Bond Island Tour | cb34f286 | 6a26c077 |
| Similan Islands Snorkeling | ebd84de7 (4500 THB) | c7fa678c (3200 THB) |
| Big Buddha & Temples Tour | 43d5cb55 | d71c7aa6 |
| Sunset Dinner Cruise | 961a6cf0 | 6c89543b |
| Thai Cooking Class | 063fe9dd | 1e38938a |
| Scuba Diving Adventure | 05539219 | 658371b5 |
| Stand Up Paddleboard | bb20d4e2 | 9c091fec |
| Wakeboarding Session | 0aa73fce | 9a5e13f8 |

### Yachts (4 дубля)
- Fountaine Pajot 40, Princess V39, Princess 54, Ferretti 80 -- по 2 записи у разных провайдеров (оставить обе, если разные провайдеры, или деактивировать одну)

### Туры с пересекающимися категориями
- "James Bond Island Tour" (category: `islands`) дублирует "James Bond Island & Phang Nga Bay Tour" (category: `island-tour`) -- разные записи, но фактически один маршрут
- Категории `islands` и `island-tour` используются параллельно -- нужно объединить в одну (`islands`)

---

## 2. Проблема: чартер vs. групповые водные прогулки

Сейчас в базе перемешаны 3 разных типа водных активностей:

| Где сейчас | Примеры | Модель бронирования |
|------------|---------|---------------------|
| experiences, category=charter | Private Boat Charter, Private Speedboat Trip | Приватный чартер, цена за лодку |
| experiences, category=yacht/sailing | Catamaran Sailing Day, Sunset Yacht Cruise | Групповая прогулка, цена за человека |
| yachts | 60+ яхт/катамаранов | Приватный чартер, 4 типа цен |

**Предложение по разграничению:**

Ввести поле `booking_model` в experiences для явного разделения:

- `group` -- групповая экскурсия (цена за человека, фиксированное расписание)
- `private` -- приватный чартер (цена за лодку/группу, гибкое время)

Также нормализовать категории: убрать `yacht`, `sailing`, `boat_tour`, `charter` из experiences и заменить на:
- `island_group_tour` -- групповые экскурсии на острова (Phi Phi, Similan, James Bond)
- `private_charter` -- приватные чартеры (перенести в yachts или пометить отдельно)
- `sunset_cruise` -- закатные круизы (группа или приват)

---

## 3. Новые on-island experiences для добавления

Сейчас в базе уже есть: Go-Kart (1), Laser Tag (1), ATV (2), Zipline (4). Необходимо добавить больше разнообразных наземных активностей:

### Развлечения и аттракционы (experience_type: activity)
1. **Phuket Shooting Range** -- Тир (Kathu) -- ~1,500 THB
2. **Escape Room Phuket** -- Квест-комнаты -- ~800 THB
3. **Surf House Phuket** -- Искусственная волна (Kata Beach) -- ~600 THB
4. **Phuket Bungy Jump** -- Тарзанка 50м (Kathu) -- ~1,900 THB
5. **Flying Hanuman Zipline** -- Зиплайн в джунглях (28 платформ) -- ~3,500 THB

### Культурные и городские (experience_type: tour)
6. **Phuket Old Town Walking Tour** -- Пешая экскурсия по Старому городу -- ~1,200 THB
7. **Phuket Night Market Food Tour** -- Гастротур по ночным рынкам -- ~1,800 THB
8. **Phuket Big Buddha & Temples Half-Day** -- Храмы + смотровые (уже есть, но обогатить описание)
9. **Phuket Instagram Spots Tour** -- Фото-тур по самым красивым точкам -- ~1,500 THB

### Семейные
10. **Phuket Wake Park (Anthem Wakepark)** -- Вейкпарк (уже есть wakeboarding, обогатить)
11. **Tiger Kingdom Phuket** -- Тигриный парк -- ~1,000 THB
12. **Phuket Elephant Sanctuary** -- Этический приют слонов -- ~3,500 THB

### Спортивные
13. **Muay Thai Training Session** -- Тренировка по тайскому боксу -- ~1,500 THB (уже есть martial-arts, 1 запись)
14. **Phuket Golf (Blue Canyon)** -- Гольф -- ~5,500 THB
15. **Phuket Paintball** -- Пейнтбол -- ~1,200 THB

---

## 4. Техническая реализация

### Шаг 1: Миграция БД
- Добавить колонку `booking_model` (enum: `group`, `private`) в таблицу `experiences` с дефолтом `group`
- Обновить существующие записи: пометить private charters
- Объединить категории `islands` и `island-tour` в одну `islands`

### Шаг 2: Деактивация 8 дублей
- SQL: `UPDATE experiences SET is_active = false WHERE id IN (...)` для второй копии каждой пары

### Шаг 3: Вставка 12-15 новых experiences
- Реальные провайдеры Пхукета (Flying Hanuman, Tiger Kingdom, Anthem Wakepark, etc.)
- С GPS, ценами, описаниями EN/RU
- Правильные категории и experience_type

### Шаг 4: Обновить EXPERIENCE_CATEGORIES
- Добавить новые категории: `shooting`, `escape_room`, `golf`, `extreme`
- Убрать дубли: `island-tour` (объединить с `islands`)

### Шаг 5: Обновить фронтенд
- `useExperiences.ts` -- добавить новые категории в EXPERIENCE_CATEGORIES
- Фильтры -- поддержка `booking_model` (группа / приват)
- Карточки -- визуальная метка "Group" / "Private"


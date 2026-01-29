
# План: Создание продуктовых категорий для свежих продуктов

## Анализ текущей ситуации

Сейчас все продукты находятся в одной категории `groceries` (Русские продукты), которая включает:
- Молочка и сыры
- Крупы и каши
- Консервы
- Сладости
- Заморозка

**Нет отдельных категорий для**: рыбы, морепродуктов, мяса, органических продуктов.

---

## Новые категории

| Категория | Slug | Иконка | Градиент |
|-----------|------|--------|----------|
| Fish & Seafood | seafood | 🐟 | from-cyan-500 to-blue-600 |
| Organic & Farm | organic | 🌿 | from-green-500 to-emerald-600 |
| Meat & Poultry | meat | 🥩 | from-red-500 to-rose-600 |

---

## Подкатегории

### Fish & Seafood (Рыба и морепродукты)
- Fresh Fish / Свежая рыба 🐠
- Seafood / Морепродукты 🦐
- Smoked Fish / Копчёная рыба 🐟
- Frozen Seafood / Заморозка 🧊

### Organic & Farm (Органика и фермерские)
- Vegetables / Овощи 🥬
- Fruits / Фрукты 🍎
- Dairy / Молочка 🥛
- Eggs / Яйца 🥚
- Honey & Oils / Мёд и масла 🍯

### Meat & Poultry (Мясо и птица)
- Beef / Говядина 🥩
- Pork / Свинина 🐷
- Lamb / Баранина 🐑
- Chicken / Курица 🍗
- Duck / Утка 🦆
- Minced Meat / Фарш 🍖

---

## Товары с фотографиями

### Fish & Seafood (~12 товаров)
| Товар | Цена | Фото |
|-------|------|------|
| Tiger Prawns (Тигровые креветки) | ฿450/kg | Unsplash prawns |
| Fresh Salmon Fillet (Филе лосося) | ฿890/kg | Unsplash salmon |
| Sea Bass (Сибас) | ฿380/whole | Unsplash sea bass |
| Squid (Кальмары) | ฿280/kg | Unsplash squid |
| Mussels (Мидии) | ฿320/kg | Unsplash mussels |
| Crab (Краб) | ฿650/kg | Unsplash crab |
| Oysters (Устрицы) | ฿150/pc | Unsplash oysters |
| Fresh Tuna (Тунец) | ฿520/kg | Unsplash tuna |
| Smoked Salmon (Копчёный лосось) | ฿450/pack | Unsplash smoked |
| Red Snapper (Красный окунь) | ฿350/kg | Unsplash snapper |
| Lobster (Лобстер) | ฿1,800/kg | Unsplash lobster |
| Scallops (Гребешки) | ฿580/kg | Unsplash scallops |

### Organic & Farm (~10 товаров)
| Товар | Цена | Фото |
|-------|------|------|
| Organic Tomatoes (Органические томаты) | ฿85/kg | Unsplash tomatoes |
| Fresh Avocados (Свежие авокадо) | ฿120/3pc | Unsplash avocado |
| Mixed Salad Greens (Микс салатов) | ฿95/pack | Unsplash salad |
| Organic Milk (Органическое молоко) | ฿75/L | Unsplash milk |
| Free Range Eggs (Яйца домашние) | ฿90/10pc | Unsplash eggs |
| Fresh Berries Mix (Микс ягод) | ฿180/pack | Unsplash berries |
| Organic Butter (Органическое масло) | ฿145/pack | Unsplash butter |
| Fresh Mushrooms (Свежие грибы) | ฿120/pack | Unsplash mushrooms |
| Cold Pressed Coconut Oil (Кокосовое масло) | ฿280/bottle | Unsplash coconut oil |
| Organic Honey (Органический мёд) | ฿350/jar | Unsplash honey |

### Meat & Poultry (~15 товаров)
| Товар | Цена | Фото |
|-------|------|------|
| Beef Ribeye (Рибай говяжий) | ฿890/kg | Unsplash ribeye |
| Beef Tenderloin (Говяжья вырезка) | ฿950/kg | Unsplash beef |
| Ground Beef (Говяжий фарш) | ฿320/kg | Unsplash ground beef |
| Pork Loin (Свиная корейка) | ฿280/kg | Unsplash pork |
| Pork Belly (Свиная грудинка) | ฿250/kg | Unsplash pork belly |
| Bacon (Бекон) | ฿195/pack | Unsplash bacon |
| Lamb Rack (Каре ягнёнка) | ฿1,200/kg | Unsplash lamb |
| Lamb Leg (Нога ягнёнка) | ฿680/kg | Unsplash lamb leg |
| Whole Chicken (Курица целая) | ฿160/kg | Unsplash chicken |
| Chicken Breast (Куриная грудка) | ฿180/kg | Unsplash breast |
| Chicken Thighs (Куриные бёдра) | ฿140/kg | Unsplash thighs |
| Black Chicken (Чёрная курица) | ฿320/kg | Unsplash black chicken |
| Duck Breast (Утиная грудка) | ฿450/kg | Unsplash duck |
| Sausages (Колбаски) | ฿220/pack | Unsplash sausages |
| Mixed Minced Meat (Смешанный фарш) | ฿280/kg | Unsplash mince |

---

## Изменения в базе данных

### 1. SQL Migration
```sql
-- 1. Создание новых категорий
INSERT INTO marketplace_categories (name_en, name_ru, slug, icon, gradient, ...)

-- 2. Создание подкатегорий
INSERT INTO marketplace_subcategories (category_slug, name_en, name_ru, slug, icon, ...)

-- 3. Добавление ~37 товаров
INSERT INTO marketplace_products (category_slug, subcategory, name_en, name_ru, price, cover_image, ...)
```

### 2. Обновление изображений категорий
```sql
UPDATE marketplace_categories SET image_url = '...' WHERE slug = 'seafood';
UPDATE marketplace_categories SET image_url = '...' WHERE slug = 'organic';
UPDATE marketplace_categories SET image_url = '...' WHERE slug = 'meat';
```

---

## UI обновления

### ProfessionalCategoryBanner.tsx
Добавить fallback изображения для новых категорий:
```typescript
const images = {
  'seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800',
  'organic': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
  'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800',
  // ... existing
};
```

---

## Технические детали

| Действие | Файлы |
|----------|-------|
| Migration | `supabase/migrations/xxx_add_food_categories.sql` |
| UI Images | `src/components/market/ProfessionalCategoryBanner.tsx` |

---

## Ожидаемый результат

После реализации на странице `/market`:
1. **3 новые категории** в баннерах с красивыми фото
2. **~37 новых товаров** с изображениями Unsplash
3. **Фильтрация по подкатегориям** (говядина, свинина, курица и т.д.)
4. Полный выбор свежих продуктов для пользователей Пхукета

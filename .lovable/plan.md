

# План: "Купить сейчас" для цветов

## Анализ текущего состояния

### Что есть сейчас:

1. **BouquetDetail.tsx** — страница букета с единственной опцией "Добавить в корзину"
2. **FlowersOrder.tsx** — страница оформления, которая берёт товары из корзины (`getItemsByType('flowers')`)
3. **useBuyNow.ts** — хук для маркетплейса, но завязан только на тип `product` и путь `/market/checkout`
4. **Корзина** — единая для всех типов товаров (CartContext)

### Проблема:

- Пользователь видит букет и хочет сразу купить, но вынужден:
  1. Добавить в корзину
  2. Перейти в корзину
  3. Нажать "Оформить"
  4. Только тогда попасть на страницу заказа

**Это 3 лишних клика для импульсивной покупки подарка!**

---

## Рекомендация

**Добавить кнопку "Купить сейчас"** рядом с "В корзину", которая:
- Сразу переводит на страницу оформления с этим букетом
- Не затрагивает содержимое корзины
- Позволяет быстро завершить покупку

**Корзину оставить** — она нужна для:
- Сбора нескольких букетов
- Заказов для разных получателей
- Сравнения перед покупкой

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  BOTTOM BAR (BouquetDetail.tsx)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  СЕЙЧАС:                                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  [В корзину]                                                    │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ПОСЛЕ:                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  ⚡ [Купить сейчас]  ·  🛒 [В корзину]                          │       │
│  │  (Primary, gold)      (Outline, secondary)                      │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  Когда товар УЖЕ в корзине:                                                │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  [-] 2 [+]  ·  ⚡ [Купить сейчас]  ·  [Корзина ฿X,XXX]          │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Поток данных

```text
BouquetDetail.tsx                    FlowersOrder.tsx
       │                                    │
       ├── "В корзину"                      │
       │   └── addItem(bouquet)             │
       │       └── → /cart → checkout ──────┼── getItemsByType('flowers')
       │                                    │
       ├── "Купить сейчас"                  │
       │   └── navigate('/flowers/order', { │
       │         state: {                   │
       │           buyNowItem: bouquet,     │
       │           isBuyNow: true           │
       │         }                          │
       │       })                           │
       │                                    │
       └────────────────────────────────────┼── location.state.buyNowItem
                                            │   ? [buyNowItem]
                                            │   : getItemsByType('flowers')
```

---

## Фазы реализации

### Фаза 1: Создать хук useBuyNowFlowers.ts

Специализированный хук для цветов:

```typescript
interface FlowersBuyNowItem {
  id: string;
  type: 'flowers';
  name: string;
  nameRu: string;
  price: number;
  currency: string;
  image?: string;
  providerId: string;
  providerName: string;
  providerNameRu: string;
  quantity: number;
  shopId: string;
}

export function useBuyNowFlowers() {
  const navigate = useNavigate();

  const buyNow = useCallback((bouquet: Bouquet, quantity = 1) => {
    const buyNowItem: FlowersBuyNowItem = {
      id: `bouquet-${bouquet.id}`,
      type: 'flowers',
      name: bouquet.name_en,
      nameRu: bouquet.name_ru,
      price: bouquet.price,
      currency: '฿',
      image: bouquet.image || undefined,
      providerId: bouquet.shop?.provider_id || 'flowers-shop',
      providerName: bouquet.shop?.name_en || 'Phuket Flowers',
      providerNameRu: bouquet.shop?.name_ru || 'Цветы Пхукета',
      quantity,
      shopId: bouquet.shop_id,
    };

    navigate('/flowers/order', {
      state: {
        buyNowItem,
        isBuyNow: true,
      },
    });
  }, [navigate]);

  return { buyNow };
}
```

---

### Фаза 2: Обновить FlowersOrder.tsx

Добавить поддержку Buy Now:

```typescript
const FlowersOrder = () => {
  const location = useLocation();
  const { getItemsByType, clearByType } = useCart();
  
  // Check for Buy Now item in state
  const buyNowState = location.state as { buyNowItem?: FlowersBuyNowItem; isBuyNow?: boolean } | null;
  const isBuyNow = buyNowState?.isBuyNow || false;
  const buyNowItem = buyNowState?.buyNowItem;

  // Use Buy Now item OR cart items
  const cartItems = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [{
        id: buyNowItem.id,
        name: buyNowItem.name,
        nameRu: buyNowItem.nameRu,
        price: buyNowItem.price,
        quantity: buyNowItem.quantity,
        providerId: buyNowItem.providerId,
        providerName: buyNowItem.providerName,
      }];
    }
    return getItemsByType('flowers').map(item => ({...}));
  }, [isBuyNow, buyNowItem, getItemsByType]);
  
  // Empty state should check for both scenarios
  if (cartItems.length === 0) {
    // Show empty state
  }
  
  // After successful order, don't clear cart if it was Buy Now
  if (result.success) {
    if (!isBuyNow) {
      clearByType('flowers');
    }
    navigate('/bookings');
  }
};
```

---

### Фаза 3: Обновить BouquetDetail.tsx

Новый Bottom Bar с двумя кнопками:

```tsx
import { useBuyNowFlowers } from '@/hooks/useBuyNowFlowers';
import { Zap } from 'lucide-react';

const BouquetDetail = () => {
  const { buyNow } = useBuyNowFlowers();
  
  // ...existing code...

  return (
    // ...
    
    {/* Bottom Bar */}
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t z-50">
      <div className="flex items-center gap-3">
        {quantity === 0 ? (
          <>
            {/* Primary: Buy Now */}
            <Button
              onClick={() => buyNow(bouquet)}
              className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Zap className="w-5 h-5 mr-2" />
              {language === 'ru' ? 'Купить сейчас' : 'Buy Now'}
            </Button>
            
            {/* Secondary: Add to Cart */}
            <Button
              variant="outline"
              onClick={addToCart}
              className="h-12 px-4"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            {/* Quantity controls */}
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
              <Button size="icon" variant="ghost" onClick={removeFromCart}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <Button size="icon" variant="ghost" onClick={addToCart}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Buy Now (current quantity) */}
            <Button
              onClick={() => buyNow(bouquet, quantity)}
              className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500"
            >
              <Zap className="w-5 h-5 mr-2" />
              {language === 'ru' ? 'Купить' : 'Buy'}
            </Button>
            
            {/* Cart with total */}
            <Button
              variant="outline"
              onClick={() => navigate('/cart')}
              className="h-12"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              ฿{totalPrice.toLocaleString()}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
```

---

## Визуальный дизайн Bottom Bar

```text
СОСТОЯНИЕ 1: Товар НЕ в корзине
┌─────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  ┌──────────────────┐ │
│  │ ⚡ Купить сейчас                     │  │  🛒              │ │
│  │ (gradient gold, primary)             │  │  (outline)       │ │
│  └──────────────────────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

СОСТОЯНИЕ 2: Товар УЖЕ в корзине
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌────────────────────────┐  ┌───────────────┐ │
│  │ [-] 2 [+]   │  │ ⚡ Купить              │  │ 🛒 ฿4,500     │ │
│  │ (controls)  │  │ (gradient gold)        │  │ (outline)     │ │
│  └─────────────┘  └────────────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/hooks/useBuyNowFlowers.ts` | NEW | Хук Buy Now для цветов |
| `src/pages/flowers/BouquetDetail.tsx` | UPDATE | Новый Bottom Bar с двумя кнопками |
| `src/pages/flowers/FlowersOrder.tsx` | UPDATE | Поддержка Buy Now через location.state |

---

## Преимущества решения

| Аспект | Текущее | После изменений |
|--------|---------|-----------------|
| Клики до оплаты | 4+ | 2 |
| Корзина | Обязательна | Опциональна |
| Импульсивные покупки | Затруднены | Оптимизированы |
| Сложные заказы | Возможны | Сохранены через корзину |
| Конверсия | Базовая | Повышенная |

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые файлы | 1 (useBuyNowFlowers.ts) |
| Обновляемые файлы | 2 |
| Сложность | Низкая |
| Риск регрессии | Минимальный |
| Время реализации | ~30 минут |


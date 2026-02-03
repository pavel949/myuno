

# План: Владельцы как toggle-персона + навигация на лендинг

## Что делаем

Карточка "Владельцам" становится toggleable (как Туристы и Резиденты), но с дополнительной логикой — **при первом клике открывается лендинг** `/owner/landing`.

## Изменения в `HeroBlock.tsx`

### 1. Обновить конфигурацию карточки Owners

```typescript
{
  id: 'owners',
  persona: 'property_owner' as UserPersona,
  isToggleable: true,  // ИЗМЕНЕНО: теперь toggle
  navigateOnFirstActivation: '/owner/landing',  // НОВОЕ: куда вести
  // остальное без изменений...
}
```

### 2. Обновить логику handleAudienceClick

```typescript
const handleAudienceClick = (card) => {
  triggerHaptic('light');
  
  const isCurrentlyActive = personas.includes(card.persona);
  
  // Всегда toggle персону
  togglePersona(card.persona);
  
  // Навигация при ПЕРВОЙ активации (только если персона была неактивна)
  if (card.navigateOnFirstActivation && !isCurrentlyActive) {
    navigate(card.navigateOnFirstActivation);
  }
};
```

### 3. Обновить AudienceCard — показывать чекмарк для всех toggleable

Убрать стрелку для Owners (так как теперь toggleable), добавить чекмарк как у остальных.

## Поведение

| Действие | Результат |
|----------|-----------|
| Первый клик на "Владельцам" | ✓ Активируется персона + Переход на `/owner/landing` |
| Повторный клик | ✓ Деактивируется персона (без навигации) |
| Кликнуть снова | ✓ Активируется персона + снова переход на лендинг |

## Визуальный результат

```text
ДО:
[✓ Турист] [  Резидент] [  Владелец →]
                              └── стрелка (навигация)

ПОСЛЕ:
[✓ Турист] [  Резидент] [✓ Владелец]
                              └── чекмарк (toggle + navigate)
```

## Комбинированный контент

Когда выбраны **Турист + Владелец**:
- QuickActions: Туры, Яхты, Транспорт + Клининг, Сервис, УК
- DiscoveryCarousel: смешанный контент для обеих ролей

## Файл для изменения

`src/components/home/HeroBlock.tsx`


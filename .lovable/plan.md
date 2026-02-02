
# План редизайна футера приложения

## Проблема
Текущий футер (CompactFooter) перегружен элементами и создаёт визуальное нагромождение:
- 9 отдельных секций в одном компоненте
- Дублирование футера на главной странице
- Неоптимальная иерархия элементов
- Отсутствие стандарта в UX Contract

## Решение: Минималистичный футер

### Структура нового футера

```text
┌─────────────────────────────────────────────────────────────┐
│  Социальные сети (Telegram · Instagram · WhatsApp)         │
├─────────────────────────────────────────────────────────────┤
│  Ссылки: О нас · FAQ · Помощь · Условия                     │
├─────────────────────────────────────────────────────────────┤
│  © 2025 myUNO · Phuket Edition                              │
└─────────────────────────────────────────────────────────────┘
```

### Что УБРАТЬ из футера

| Элемент | Причина удаления | Куда переместить |
|---------|------------------|------------------|
| Partner CTA баннер | Слишком громоздкий | Отдельный компонент `ListWithUsBanner` (уже используется на главной) |
| Trust Badges | Дублируют информацию | `SafetyBanner` на главной странице |
| Location badge | Избыточен | В раздел About или убрать |
| Support icons (App, SOS, Help) | Перегружают футер | В раздел Account или навигацию |

### Что ОСТАВИТЬ в футере (3 секции)

1. **Социальные сети** — компактные иконки в ряд
2. **Навигационные ссылки** — About · FAQ · Help · Terms · Privacy
3. **Копирайт** — бренд и версия

---

## Технические изменения

### Файл 1: `src/components/layout/CompactFooter.tsx`

Полный рефакторинг — уменьшить с ~228 строк до ~80:

```tsx
export function CompactFooter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const navLinks = [
    { to: '/about', label: isRu ? 'О нас' : 'About' },
    { to: '/faq', label: 'FAQ' },
    { to: '/support', label: isRu ? 'Помощь' : 'Help' },
    { to: '/terms', label: isRu ? 'Условия' : 'Terms' },
    { to: '/privacy', label: isRu ? 'Конфиденциальность' : 'Privacy' },
  ];

  const socialLinks = [
    { href: 'https://t.me/myuno_support', icon: Send, label: 'Telegram' },
    { href: 'https://instagram.com/myuno.app', icon: Instagram, label: 'Instagram' },
    { href: 'https://wa.me/...', icon: MessageCircle, label: 'WhatsApp' },
  ];

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Социальные сети */}
        <div className="flex justify-center gap-6">
          {socialLinks.map(...)}
        </div>
        
        {/* Навигация */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {navLinks.map(...)}
        </div>
        
        {/* Копирайт */}
        <p className="text-center text-xs text-muted-foreground">
          © 2025 myUNO · Phuket Edition
        </p>
      </div>
    </footer>
  );
}
```

### Файл 2: `src/pages/Index.tsx`

Удалить дублирующий инлайн футер (строки 234-238):

```diff
- {/* Footer - minimal */}
- <div className="text-center py-3 border-t border-border/50">
-   <p className="text-xs text-muted-foreground">
-     © 2025 myUNO · {t('home.verifiedPartners')}
-   </p>
- </div>
```

### Файл 3: `docs/UX_CONTRACT.md`

Добавить секцию о футере:

```markdown
## 18. Footer Component

### 18.1 CompactFooter (🔴 MUST)
Все страницы с `showFooter={true}` используют единый минимальный футер.

Обязательные элементы:
- Социальные ссылки (Telegram, Instagram, WhatsApp)
- Навигационные ссылки (About, FAQ, Help, Terms, Privacy)
- Копирайт с брендом

Запрещено добавлять:
- CTA баннеры (использовать отдельные компоненты)
- Trust badges (размещать в контенте страницы)
- Громоздкие секции
```

---

## Визуальное сравнение

### До (текущий):
```text
┌──────────────────────────────────────┐
│ 🤝 Стать партнёром                   │  ← Крупный баннер
│    Предложите свои услуги...         │
├──────────────────────────────────────┤
│ [✓ G-Trust] [⏰ 24/7] [👥 200+]       │  ← Trust badges
├──────────────────────────────────────┤
│ О нас · Как работает · FAQ · Контакты│
│                                      │
│ [📱 App] [🆘 SOS] [❓ Help]           │  ← Кнопки
├──────────────────────────────────────┤
│ 📍 Phuket, Thailand                  │
├──────────────────────────────────────┤
│ [Telegram] [Instagram] [WhatsApp]    │
├──────────────────────────────────────┤
│     myUNO                            │
│ "The only app you need abroad"       │
├──────────────────────────────────────┤
│ Условия · Конфиденциальность · ...   │
│ © 2025 myUNO · Phuket Edition v1.0   │
└──────────────────────────────────────┘
```

### После (предлагаемый):
```text
┌──────────────────────────────────────┐
│   [📱 TG] · [📷 IG] · [💬 WA]         │  ← Компактные иконки
├──────────────────────────────────────┤
│ О нас · FAQ · Помощь · Условия       │  ← Одна строка
├──────────────────────────────────────┤
│ © 2025 myUNO · Phuket Edition        │
└──────────────────────────────────────┘
```

---

## Порядок выполнения

1. **Рефакторинг CompactFooter.tsx** — минимализация до 3 секций
2. **Удаление дубля в Index.tsx** — убрать инлайн футер
3. **Обновление UX_CONTRACT.md** — добавить стандарт футера
4. **Проверка всех страниц с `showFooter`** — OwnerLanding и др.

---

## Ожидаемый результат

- Футер уменьшится с ~228 строк до ~80
- Визуально чистый, не перегруженный
- Соответствует минималистичному стилю платформы
- Единый стандарт на всех страницах

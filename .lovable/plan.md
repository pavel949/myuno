## Проблема

На `/discover` (NavigatorPage v2) сетки сервисов в каждой секции кластера накладываются друг на друга и на следующие секции (видно на скриншоте: «Build / B2B: developer portal…», «Visas», «Taxes» и тайлы рендерятся в одном вертикальном слое).

## Корень бага

В `src/components/navigation/NavigatorPage.tsx`, строки **936–974**, внутри каждой `<section>` есть **двойная обёртка grid**:

```tsx
<div className="grid gap-2"
     style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '132px' }}>
  <style>{`@media ... { .nav-v2-grid-${cluster.id} { ... } }`}</style>
  <div
    className={`nav-v2-grid-${cluster.id} grid gap-2`}
    style={{ gridColumn: '1 / -1',
             gridTemplateColumns: 'repeat(3, 1fr)',
             gridAutoRows: '132px' }}
  >
    {hasFeature && <FeaturedTile … />}
    {eligible.map(...ServiceTile)}
  </div>
</div>
```

Внешний grid имеет `gridAutoRows: 132px` и единственного ребёнка (внутренний grid). Внутренний выставлен `gridColumn: '1 / -1'` и реально вырастает на N строк (4–8 рядов тайлов). Внешний при этом резервирует под него только **одну строку 132px** → весь излишек контента **визуально вываливается за границу секции**, и следующая `<section>` стартует через 132px, накладываясь на хвост предыдущей.

Эффект ровно тот, что на скриншоте: тайлы предыдущего кластера наезжают на заголовок и описание следующего.

## Решение

Удалить лишнюю внешнюю grid-обёртку — оставить только внутренний `nav-v2-grid-{id}` с `<style>`-блоком. Внутренний div уже реализует адаптивные колонки (3 → 4 → 5 → 6) через media-queries по своему классу.

### Diff (концептуально)

```tsx
{/* Service grid */}
<>
  <style>{`
    .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(3,1fr); grid-auto-rows: 132px; }
    @media (min-width:640px)  { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(4,1fr) !important; } }
    @media (min-width:1024px) { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(5,1fr) !important; } }
    @media (min-width:1280px) { .nav-v2-grid-${cluster.id} { grid-template-columns: repeat(6,1fr) !important; } }
  `}</style>
  <div className={`nav-v2-grid-${cluster.id} grid gap-2`}>
    {hasFeature && <FeaturedTile data={featured!} language={language} onNavigate={navigate} />}
    {eligible.map(svc => (
      <ServiceTile key={`${cluster.id}-${svc.path}`} service={svc}
                   clusterId={cluster.id} language={language} onNavigate={navigate} />
    ))}
  </div>
</>
```

Базовые `grid-template-columns` и `grid-auto-rows` переехали внутрь того же `<style>`, чтобы не зависеть от inline-стилей и сохранить mobile-first значение по умолчанию.

## Объём правок

- 1 файл: `src/components/navigation/NavigatorPage.tsx` (строки ~935–974).
- Логика, данные, фильтры, поиск, persona-табы — без изменений.
- Никаких миграций / правок схемы / других страниц.

## Проверка после

1. Открыть `/discover` на 390×844 (мобильный).
2. Прокрутить вниз: секции «Прибытие», «Жизнь», «Инвестиции», «Право», «Стройка» идут друг под другом без наложений; тайлы в строгой 3-колоночной сетке.
3. Проверить десктоп (≥1024): 5 колонок без скачков.
4. Featured-тайл (Виза-пакет / ROI Hub) занимает 2×2 и не ломает поток.

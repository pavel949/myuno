# Промпт: написание статьи Knowledge Hub (myUNO)

> Для задач «напиши pillar» или «напиши cluster-статью».

---

## КОНТЕКСТ

Ты контент-редактор myUNO. Обязательно прочитай:

1. `/docs/canonical/10-semantic-core.md` §4, §5, §6
2. `/docs/canonical/03-tone-of-voice.md` полностью
3. `/docs/canonical/01-segmentation-framework.md` §4, §5
4. Для off-plan / DD / рейтингов — `/docs/canonical/06-clearview-methodology.md`

## ЗАДАЧА

[Тема]

## ПЕРЕД ПИСЬМОМ

Ответь на 10 пунктов:

1. Единственный intent (одно предложение)?
2. Pillar или cluster? К какому кластеру §6?
3. Если cluster — какая pillar родитель?
4. Lifecycle / Role / Cluster теги (§3)?
5. Target personas (§4 segmentation)?
6. 5–10 primary запросов (RU+EN)?
7. Длина (pillar 2500–4000 слов, cluster 800–1500)?
8. H2/H3 outline?
9. Связанные статьи (≥5 для pillar, ≥2 для cluster)?
10. Какие данные/цифры/факты нужны (внешние источники, не выдумывать)?

Ожидай подтверждения outline. Только после ОК — писать.

## ТРЕБОВАНИЯ К ТЕКСТУ

1. Первый абзац — проблема глазами клиента. Никакого «myUNO предлагает».
2. Минимум 3 конкретных числа/факта/срока.
3. Лексика §5 строго (`canonicalNames.ts`).
4. Запрещённые слова §14 — не используй.
5. Длина предложений 14–18 слов в среднем, максимум 25.
6. Обращение «вы» (строчная) в RU.
7. «Что нас беспокоит» — обязательный раздел в коммерческих статьях.
8. Pillar → 5–10 cluster, cluster → pillar + 1–2 соседних cluster.
9. Источники для каждой юридической/налоговой цифры (Revenue Code, Land Act, BOT).
10. Для pillar — FAQ из 6–10 вопросов (`buildFaqSchema` для schema.org).

## METADATA frontmatter (.mdx)

```yaml
---
title: '[H1] · myUNO'
description: '[по формуле §2.4, ≤160 chars]'
slug: '[kebab-case-english]'
cluster: '[из §6, например 6.3]'
lifecycle: ['scout', 'snowbird']
role: ['investor-passive']
situationCluster: 'investing'
publishedAt: '2026-04-XX'
author: '[Имя]'
reviewer: '[Имя]'
factCheckedBy: '[Имя]'
language: 'ru'
hreflang:
  en: '/en/guides/[slug]'
schemaType: 'Article'
---
```

## АКЦЕПТ

- Чек-лист §16 PR template пройден
- Канонические имена корректны (`npm run validate:semantic`)
- Title/description в лимитах
- ≥3 конкретных числа
- «Что нас беспокоит» (для коммерческих)
- Рабочие внутренние ссылки
- FAQ для pillar

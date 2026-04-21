# myUNO Content Style Guide (RU / EN)

> Inspired by the GOV.UK content design principles. Adapted for a commercial
> super-app serving foreigners on Phuket. Applies to every user-facing string:
> page titles, button labels, empty states, error messages, listing copy,
> notifications, and AI Concierge responses.

Version: 1.0 · Last updated: 2026-04-21

---

## 1. The single rule

Write so that a tired person on a phone, in their second language, can finish
the task in one try.

If a sentence fails that test, rewrite it.

---

## 2. Tone

| | English | Russian |
|---|---|---|
| Voice | Calm, factual, helpful | Спокойный, по делу, без формализма |
| Person | Second person ("you") | На «вы», без канцелярита |
| Mood | Active | Активный залог |
| Avoid | Marketing fluff, jargon, exclamation marks | Маркетинг, жаргон, восклицательные знаки |

We are infrastructure, not a brochure. Trust comes from clarity, not adjectives.

---

## 3. Length budget

| Surface | Max length |
|---|---|
| Page title (H1) | 60 chars |
| Section header (H2) | 40 chars |
| Button label | 3 words / 24 chars |
| Card title | 6 words / 48 chars |
| Card subtitle | 12 words / 90 chars |
| Body sentence | 20 words / 25 words RU |
| Body paragraph | 3 sentences |
| Empty state | 1 sentence + 1 action |
| Error message | 1 sentence + how to recover |

Readability target: Flesch-Kincaid grade 7 (EN), LIX 40 (RU).

---

## 4. Plain-language rules

### Do
- Use everyday words: *send*, *buy*, *help* — not *submit*, *purchase*, *assist*.
- Lead with the verb a user wants to perform: **«Продлить визу»**, not **«Услуги по продлению виз»**.
- Put the most important information first.
- Spell out abbreviations on first use: *TM30 (address registration)*.
- Use numerals for all numbers (*7 шагов*, not *семь шагов*).
- Use the local currency symbol (฿) and ISO code (THB) when amounts matter.

### Don't
- Don't use Latin abbreviations: *e.g.*, *i.e.*, *etc.* → *например*, *то есть*, *и так далее*.
- Don't use "please" / "пожалуйста" in UI labels — it's noise.
- Don't capitalise words for emphasis. Use weight or colour tokens.
- Don't say "click here". Make the link text describe the destination.
- Don't use idioms or puns — they don't translate.

---

## 5. Stop-words and replacements

| Don't write | Write instead |
|---|---|
| utilise | use |
| in order to | to |
| at this moment in time | now |
| commence / terminate | start / end |
| facilitate | help |
| осуществить / произвести | сделать |
| в настоящее время | сейчас |
| в случае если | если |
| денежные средства | деньги |
| дорогие клиенты | (удалить) |

---

## 6. Formatting

- **Dates**: `21 Apr 2026` (EN), `21 апр 2026` (RU). Avoid `04/21/2026`.
- **Times**: 24-hour: `14:30`. Add timezone if not local: `14:30 ICT`.
- **Phone**: `+66 ...` international format only.
- **Money**: `฿12,500` or `12,500 THB`. No `THB12500`.
- **Lists**: 3+ items → bullet list. 1–2 items → inline prose.
- **Bold**: only for the action a user must take next.

---

## 7. Buttons and links

A button label must complete the sentence: *I want to ___*.

| Good | Bad |
|---|---|
| Book viewing | Submit |
| Pay ฿2,500 | Continue |
| Cancel booking | OK |
| Запросить расчёт | Отправить |
| Скачать TM30 | Подтвердить |

If a button starts a process that costs money, show the amount on the button.

---

## 8. Errors

Three parts, in order:

1. **What happened** — in plain words.
2. **Why it matters** — only if not obvious.
3. **What to do next** — concrete action.

```
Bad:  "Error 422: validation failed"
Good: "Check-out must be after check-in. Pick a later date."
RU:   "Дата выезда должна быть позже даты заезда. Выберите более позднюю дату."
```

Never blame the user. Never expose stack traces.

---

## 9. Bilingual rules

- Every user-facing string ships in both `ru` and `en`. No fallbacks to the
  other language at render time.
- Translate meaning, not words. Russian sentences are ~20% longer — design
  layouts for the longer string.
- Keep product names in English: *myUNO*, *Lovable Cloud*, *Stripe*.
- Keep Thai legal terms in English with Russian gloss on first use:
  *Chanote (чанот, полное право собственности)*.

---

## 10. AI-generated copy

When the AI Concierge or any LLM-driven feature produces user-facing text,
the same rules apply. Add a system prompt fragment that enforces:

- Max 3 sentences per response unless the user asks for detail.
- No emoji unless the user used one first.
- No medical, legal, or tax advice — redirect to a verified provider.
- Always end with one concrete next step the user can tap.

---

## 11. Checklist before publishing a listing or page

- [ ] Title under 60 characters and starts with the task verb
- [ ] First sentence answers: *what is this and who is it for*
- [ ] Price, duration, and eligibility visible without scrolling on 375px
- [ ] All abbreviations expanded on first use
- [ ] Both RU and EN versions present and equivalent
- [ ] No exclamation marks, no all-caps, no "click here"
- [ ] Primary CTA uses an action verb and shows price if applicable
- [ ] Error and empty states written
- [ ] Accessibility: image `alt`, button `aria-label` for icon-only

---

## 12. Ownership

- Product writes the first draft.
- Localisation lead reviews RU.
- Engineer adds to `i18n/` keys, never inlines strings.
- Admin moderation enforces this checklist on user-generated listings.

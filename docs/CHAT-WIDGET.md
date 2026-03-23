# ChatWidget (`/api/chat`)

## UI

- Floating **gold gradient** FAB (bottom-right).
- Panel **360×520** (`w-[360px] h-[520px]`).
- Languages: **RU / EN / ZH / DE / TH** (independent of site i18n).
- Bubbles: **user** = gold gradient, **bot** = dark (`zinc-900`).
- **Typing** indicator (3 dots).
- **Quick replies** under bot messages (chips).
- **MiniListingCard** + Book when API returns `listings[]`.
- **Telegram** + **WhatsApp** links from `COMPANY_CONTACTS`.

## Client contract

`POST` **`getChatApiUrl()`** — default **`/api/chat`**, or **`VITE_CHAT_API_URL`** (full URL).

```json
{
  "message": "string",
  "leadId": "uuid",
  "language": "ru" | "en" | "zh" | "de" | "th"
}
```

**`leadId`** is persisted in **`sessionStorage`** (`myuno_chat_lead_id`). Server may return a new `leadId` in the JSON body; it will be stored.

### Suggested response shape

```json
{
  "reply": "Markdown or plain text",
  "leadId": "optional-uuid",
  "quickReplies": ["Option A", "Option B"],
  "listings": [
    {
      "id": "uuid",
      "title": "Villa Rawai",
      "price": 12500000,
      "currency": "THB",
      "image_url": "https://..."
    }
  ]
}
```

Aliases: `message` / `text` for reply body are also accepted.

## Production (Vite SPA)

Same-origin **`/api/chat`** only works if the host provides a route (e.g. Vercel Serverless, reverse proxy). Otherwise set **`VITE_CHAT_API_URL`** to your backend or Edge Function URL at build time.

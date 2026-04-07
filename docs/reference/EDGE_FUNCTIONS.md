# Edge Functions Reference

All edge functions are in `supabase/functions/`. Each function is a Deno-based serverless handler deployed automatically.

## Shared Utilities

`supabase/functions/_shared/supabase.ts` provides:
- `createServiceClient()` — Admin client (bypasses RLS)
- `createAnonClient()` — Client respecting RLS
- `createClient` — Raw Supabase client constructor

## Functions by Category

### 🤖 AI Functions

| Function | Description | Secrets |
|----------|-------------|---------|
| `ai-agent` | Conversational AI agent (multi-purpose) | `LOVABLE_API_KEY` |
| `ai-generate-description` | Auto-generate listing descriptions | `LOVABLE_API_KEY` |
| `ai-image-enhance` | Image quality enhancement | `LOVABLE_API_KEY` |
| `ai-intake-extract` | Extract structured data from text/images | `LOVABLE_API_KEY` |
| `ai-personalize-home` | Personalized homepage recommendations | `LOVABLE_API_KEY` |
| `ai-smart-data` | Smart data analysis and insights | `LOVABLE_API_KEY` |
| `ai-smart-search` | AI-powered semantic search | `LOVABLE_API_KEY` |
| `ai-support-chat` | Customer support chatbot | `LOVABLE_API_KEY` |
| `ai-translate` | Auto-translation EN↔RU | `LOVABLE_API_KEY` |
| `intake-listing-agent` | AI agent for bulk listing intake | `LOVABLE_API_KEY` |
| `lifeos-ai-analyst` | LifeOS AI insights and recommendations | `LOVABLE_API_KEY` |
| `listing-quality-analyzer` | Listing completeness/quality scoring | `LOVABLE_API_KEY` |

### 💳 Payments (Stripe)

| Function | Description | Secrets |
|----------|-------------|---------|
| `create-checkout-session` | Generic Stripe checkout | `STRIPE_SECRET_KEY` |
| `create-checkout` | Unified checkout flow | `STRIPE_SECRET_KEY` |
| `create-flowers-checkout` | Flower order checkout | `STRIPE_SECRET_KEY` |
| `create-market-checkout` | Marketplace checkout | `STRIPE_SECRET_KEY` |
| `create-order-checkout` | Order-based checkout | `STRIPE_SECRET_KEY` |
| `create-property-deposit-checkout` | Property deposit payment | `STRIPE_SECRET_KEY` |
| `create-restaurant-checkout` | Restaurant order checkout | `STRIPE_SECRET_KEY` |
| `create-service-checkout` | Home service checkout | `STRIPE_SECRET_KEY` |
| `create-vendor-subscription` | Vendor subscription setup | `STRIPE_SECRET_KEY` |
| `check-vendor-subscription` | Verify vendor subscription status | `STRIPE_SECRET_KEY` |
| `stripe-webhook` | Stripe webhook handler | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

### 📧 Notifications

| Function | Description | Secrets |
|----------|-------------|---------|
| `notify-admin-order` | Notify admin of new orders | `RESEND_API_KEY` |
| `notify-admin-property-submission` | New property submission alert | `RESEND_API_KEY` |
| `notify-fasttrack-booking` | Fast-track airport booking alert | `RESEND_API_KEY` |
| `notify-lead-whatsapp` | WhatsApp lead notification | — |
| `notify-new-signup` | New user registration alert | `RESEND_API_KEY` |
| `notify-order-status-change` | Order status update notification | `RESEND_API_KEY` |
| `notify-transfer-booking` | Transfer booking confirmation | `RESEND_API_KEY` |
| `property-moderation-email` | Property moderation result email | `RESEND_API_KEY` |
| `restaurant-order-notifications` | Restaurant order alerts | `RESEND_API_KEY` |
| `send-order-email` | Order confirmation email | `RESEND_API_KEY` |
| `send-promotions` | Promotional email campaigns | `RESEND_API_KEY` |
| `send-property-report` | Property analytics report email | `RESEND_API_KEY` |
| `booking-reminders` | Upcoming booking reminders | `RESEND_API_KEY` |

### 🔄 Sync & Import

| Function | Description | Secrets |
|----------|-------------|---------|
| `airbnb-sync` | Sync listings from Airbnb | — |
| `ical-sync` | iCal calendar synchronization | — |
| `ical-scheduled-sync` | Scheduled iCal sync (cron) | — |
| `yacht-ical-sync` | Yacht calendar sync | — |
| `bulk-import` | Bulk data import from CSV/Excel | — |
| `import-experience-media` | Import media for experiences | — |
| `etagi-scrape-projects` | Scrape property projects from Etagi | `FIRECRAWL_API_KEY` |

### 🛠️ Utilities

| Function | Description | Secrets |
|----------|-------------|---------|
| `calendar-export` | Export bookings to calendar format | — |
| `yacht-calendar-export` | Export yacht bookings to iCal | — |
| `extract-images-from-url` | Extract images from a webpage | — |
| `generate-booking-voucher` | Generate PDF booking voucher | — |
| `generate-report-pdf` | Generate analytics PDF report | — |
| `geocode-address` | Geocode address to coordinates | `MAPBOX_PUBLIC_TOKEN` |
| `get-mapbox-token` | Serve Mapbox token to frontend | `MAPBOX_PUBLIC_TOKEN` |
| `get-weather` | Current weather data | — |
| `image-resize` | Resize/optimize images | — |
| `ocr-receipt` | OCR text extraction from receipts | `LOVABLE_API_KEY` |
| `proxy-image` | Image proxy for CORS bypass | — |
| `remove-bouquet-backgrounds` | Remove backgrounds from flower images | — |
| `scan-business-card` | Extract info from business cards | `LOVABLE_API_KEY` |
| `user-analytics-api` | User behavior analytics endpoint | — |

### 👑 Admin

| Function | Description | Secrets |
|----------|-------------|---------|
| `admin-manage-user` | Suspend/activate/deactivate/delete users + role management | Service Role (auto) |

### 🏢 Business Logic

| Function | Description | Secrets |
|----------|-------------|---------|
| `leads-factory` | Automated lead generation | — |
| `vendor-acquisition` | Vendor onboarding automation | `RESEND_API_KEY` |
| `vendor-portal` | Vendor portal API endpoints | — |

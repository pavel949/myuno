# Edge Functions Index

> Auto-generated: 2026-02-25. Audit by platform cleanup Part 4.

## Summary

- **Total Functions:** 80
- **Active (frontend-called):** ~45
- **Cron-only:** 5
- **Orphan (flagged):** 10
- **Phantom (config only, no code):** 2

---

## 🤖 AI Functions

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 1 | `ai-agent` | Multi-purpose conversational AI agent | Admin UI | ✅ Active |
| 2 | `ai-content-planner` | Content calendar planning | None found | ⚠️ Orphan |
| 3 | `ai-cross-sell` | Generate cross-sell offers for bookings | BookingCrossSellSheet | ✅ Active |
| 4 | `ai-generate-description` | Auto-generate listing descriptions | AIDescriptionGenerator | ✅ Active |
| 5 | `ai-guest-autoreply` | Auto-reply to guest messages | useGuestPropertyChat | ✅ Active |
| 6 | `ai-image-enhance` | Image quality enhancement | Admin UI | ✅ Active |
| 7 | `ai-intake-extract` | Extract structured data from text/images | useIntakeAgent | ✅ Active |
| 8 | `ai-owner-nurture` | Owner relationship nurturing emails | None found | ⚠️ Orphan |
| 9 | `ai-personalize-home` | Personalized homepage recommendations | Homepage | ✅ Active |
| 10 | `ai-platform-intelligence` | Platform analytics insights | None found | ⚠️ Orphan |
| 11 | `ai-pricing-optimizer` | Dynamic pricing suggestions | None found | ⚠️ Orphan |
| 12 | `ai-smart-data` | Smart data analysis | Admin UI | ✅ Active |
| 13 | `ai-smart-search` | AI-powered semantic search | Search page | ✅ Active |
| 14 | `ai-support-chat` | Customer support chatbot | Support chat widget | ✅ Active |
| 15 | `ai-translate` | Auto-translation EN↔RU | Translation UI | ✅ Active |
| 16 | `intake-listing-agent` | AI agent for bulk listing intake | useIntakeAgent | ✅ Active |
| 17 | `lifeos-ai-analyst` | LifeOS AI insights | useLifeOSAIInsights | ✅ Active |
| 18 | `listing-quality-analyzer` | Listing completeness/quality scoring | useListingQualityAnalysis | ✅ Active |

## 💳 Payment (Stripe)

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 19 | `create-checkout` | Unified checkout flow | AirportTransferBooking | ✅ Active |
| 20 | `create-checkout-session` | Generic Stripe checkout (wallet top-up) | Wallet page | ✅ Active |
| 21 | `create-flowers-checkout` | Flower order checkout | Flower shop | ✅ Active |
| 22 | `create-market-checkout` | Marketplace checkout | None found | ⚠️ Orphan |
| 23 | `create-order-checkout` | Order-based checkout | useStripeUnifiedCheckout | ✅ Active |
| 24 | `create-property-deposit-checkout` | Property deposit payment | DepositPaymentOptions | ✅ Active |
| 25 | `create-refund` | Process refunds | Admin (manual) | ✅ Active |
| 26 | `create-restaurant-checkout` | Restaurant order checkout | DeliveryCheckout | ✅ Active |
| 27 | `create-service-checkout` | Home service checkout | None found | ⚠️ Orphan |
| 28 | `create-vendor-subscription` | Vendor subscription setup | Vendor portal | ✅ Active |
| 29 | `check-vendor-subscription` | Verify vendor subscription | Vendor portal | ✅ Active |
| 30 | `stripe-webhook` | Stripe webhook handler | Stripe (external) | ✅ Active |

## 📧 Notifications

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 31 | `booking-reminders` | Upcoming booking reminders | Cron: hourly | ✅ Cron |
| 32 | `notify-admin-order` | Notify admin of new orders | useUniversalLead | ✅ Active |
| 33 | `notify-admin-property-submission` | New property submission alert | Admin flow | ✅ Active |
| 34 | `notify-fasttrack-booking` | Fast-track airport booking alert | AirportFastTrackPage | ✅ Active |
| 35 | `notify-lead-whatsapp` | WhatsApp lead notification | useUniversalLead | ✅ Active |
| 36 | `notify-new-signup` | New user registration alert | Auth page | ✅ Active |
| 37 | `notify-order-status-change` | Order status update notification | AdminOrderDetailSheet | ✅ Active |
| 38 | `notify-transfer-booking` | Transfer booking confirmation | AirportTransferBooking | ✅ Active |
| 39 | `property-moderation-email` | Property moderation result email | Admin flow | ✅ Active |
| 40 | `restaurant-order-notifications` | Restaurant order alerts | Restaurant flow | ✅ Active |
| 41 | `send-order-email` | Order confirmation email | Order flow | ✅ Active |
| 42 | `send-promotions` | Promotional email campaigns | MCCBroadcastPanel | ✅ Active |
| 43 | `send-property-report` | Property analytics report email | Admin | ✅ Active |
| 44 | `send-email` | Generic email sender (used by other functions) | Internal | ✅ Utility |
| 45 | `process-guest-messages` | Process incoming guest messages | ai-guest-autoreply (internal) | ✅ Utility |

## 📅 Calendar & Sync

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 46 | `ical-sync` | Manual iCal calendar sync | useExternalCalendars | ✅ Active |
| 47 | `ical-scheduled-sync` | Scheduled iCal sync | Cron: every 30min | ✅ Cron |
| 48 | `yacht-ical-sync` | Yacht calendar sync | useYachtExternalCalendars | ✅ Active |
| 49 | `calendar-export` | Export bookings to iCal | Calendar UI | ✅ Active |
| 50 | `yacht-calendar-export` | Export yacht bookings to iCal | Yacht calendar | ✅ Active |
| 51 | `airbnb-sync` | Sync listings from Airbnb | Admin | ✅ Active |

## 🔄 Automation (Cron)

| # | Function | Purpose | Schedule | Status |
|---|----------|---------|----------|--------|
| 52 | `auto-lifecycle-actions` | Customer lifecycle automation | Daily 10am | ✅ Cron |
| 53 | `auto-vendor-nurture` | Vendor onboarding drip | Daily 11am | ✅ Cron |
| 54 | `post-order-autopilot` | Post-order follow-ups | Every 2h | ✅ Cron |
| 55 | `update-user-segments` | User segmentation refresh | Every 6h | ✅ Cron |
| 56 | `auto-social-publish` | Auto-publish to social media | None found | ⚠️ Orphan |
| 57 | `document-reminder-check` | Document expiry reminders | None found | ⚠️ Orphan |
| 58 | `utility-payment-reminders` | Utility bill reminders | None found | ⚠️ Orphan |

## 🔍 Scraping & Import

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 59 | `etagi-scrape-projects` | Scrape from Etagi | Admin | ✅ Active |
| 60 | `enrich-projects` | Enrich project data | AdminProjects | ✅ Active |
| 61 | `bulk-import` | Bulk data import CSV/Excel | useIntakeAgent | ✅ Active |
| 62 | `import-experience-media` | Import media for experiences | useExperienceMedia | ✅ Active |

## 🛠️ Utilities

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 63 | `extract-images-from-url` | Extract images from webpage | ImagePickerFromUrl | ✅ Active |
| 64 | `generate-booking-voucher` | Generate PDF booking voucher | useBookingVouchers | ✅ Active |
| 65 | `generate-report-pdf` | Generate analytics PDF | Admin | ✅ Active |
| 66 | `generate-sitemap` | Generate SEO sitemap | None found | ⚠️ Orphan |
| 67 | `geocode-address` | Geocode address to coordinates | Property editor | ✅ Active |
| 68 | `get-mapbox-token` | Serve Mapbox token | useMapbox | ✅ Active |
| 69 | `get-weather` | Current weather data | Homepage | ✅ Active |
| 70 | `image-resize` | Resize/optimize images | Internal utility | ✅ Utility |
| 71 | `ocr-receipt` | OCR from receipts | Admin | ✅ Active |
| 72 | `proxy-image` | Image proxy for CORS | Internal utility | ✅ Utility |
| 73 | `remove-bouquet-backgrounds` | Remove flower image backgrounds | Admin | ✅ Active |
| 74 | `scan-business-card` | Extract info from business cards | BusinessCardScanner | ✅ Active |
| 75 | `user-analytics-api` | User behavior analytics | None found | ⚠️ Orphan |
| 76 | `publish-telegram-post` | Publish to Telegram channel | None found | ⚠️ Orphan (future) |

## 🏢 Business Logic

| # | Function | Purpose | Called By | Status |
|---|----------|---------|-----------|--------|
| 77 | `leads-factory` | Automated lead generation | Admin | ✅ Active |
| 78 | `vendor-acquisition` | Vendor onboarding automation | Admin | ✅ Active |
| 79 | `vendor-portal` | Vendor portal API endpoints | Vendor UI | ✅ Active |

## 👻 Phantom Entries (in config.toml, no code)

| # | Function | Status |
|---|----------|--------|
| 80 | `fazwaz-discover-projects` | ❌ No code exists |
| 81 | `fazwaz-scrape-project` | ❌ No code exists |

---

## 🚨 Duplicate Cron Jobs (Fixed 2026-02-25)

| Job | Schedule | Action |
|-----|----------|--------|
| `ical-sync-every-5-min` (jobid 10) | `*/5 * * * *` | ❌ Removed — duplicate |
| `ical-scheduled-sync-job` (jobid 1) | `*/15 * * * *` | ❌ Removed — duplicate |
| `ical-scheduled-sync` (jobid 9) | `0 */4 * * *` | ✅ Updated to `*/30 * * * *` |
| `update-user-segments-hourly` (jobid 2) | `0 * * * *` | ❌ Removed — duplicate |
| `update-user-segments` (jobid 4) | `0 */6 * * *` | ✅ Kept |

## ⚠️ Orphan Functions (Flagged for review)

These functions have no frontend callers and no cron schedule. Review before 2026-03-27:

1. `ai-content-planner`
2. `ai-owner-nurture`
3. `ai-platform-intelligence`
4. `ai-pricing-optimizer`
5. `auto-social-publish`
6. `document-reminder-check`
7. `utility-payment-reminders`
8. `create-market-checkout`
9. `create-service-checkout`
10. `generate-sitemap`
11. `user-analytics-api`
12. `publish-telegram-post`

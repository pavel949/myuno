# myUNO Edge Functions API Reference

## Overview

This document provides comprehensive documentation for all Edge Functions deployed on the myUNO platform. All functions are accessible via HTTPS and require proper authentication where noted.

**Base URL**: `https://kakkwibljrjsawxgnupk.supabase.co/functions/v1`

> ⚠️ **Note:** The old mirror project `erfwtoavipwjqmylpizt` is deprecated. All functions are deployed to PRIMARY project `kakkwibljrjsawxgnupk`. <!-- updated: 2026-04-20 -->

---

## Authentication

Most endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Some endpoints (marked as **Public**) can be accessed without authentication.

---

## Rate Limiting

All endpoints implement rate limiting. Responses include rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds to wait (on 429) |

**Default Limits:**
- Auth endpoints: 5 requests/minute
- AI endpoints: 10 requests/minute
- Payment endpoints: 20 requests/minute
- Public read endpoints: 100 requests/minute

---

## AI Endpoints

### POST `/ai-agent`
Universal AI agent gateway. Routes to specific agents based on `agent_slug`.

**Request Body:**
```json
{
  "agent_slug": "string",
  "messages": [
    { "role": "user", "content": "string" }
  ],
  "context": {}
}
```

**Available Agents:**
- `support-assistant` - Customer support bot
- `property-assistant` - Property inquiry handler
- `owner-assistant` - Owner dashboard helper
- `smart-search` - Natural language search
- `description-generator` - Listing description generator
- `translate` - Multi-language translation
- `personalize-home` - Homepage personalization
- `lead-scorer` - Lead scoring AI
- `listing-analyzer` - Listing quality analysis
- `vendor-acquisition` - Vendor outreach (admin only)

---

### POST `/ai-smart-search`
Natural language search across all verticals.

**Request Body:**
```json
{
  "query": "Find a villa with pool near beach under $2000/month"
}
```

**Response:**
```json
{
  "results": [...],
  "interpretation": {
    "type": "property",
    "filters": { "hasPool": true, "maxPrice": 2000 }
  }
}
```

---

### POST `/ai-translate`
Translate content between supported languages (EN, RU, TH).

**Request Body:**
```json
{
  "text": "Hello world",
  "targetLanguage": "ru"
}
```

---

### POST `/listing-quality-analyzer`
Analyze listing quality and generate improvement suggestions.

**Request Body:**
```json
{
  "listingId": "uuid",
  "listingType": "property|tour|restaurant"
}
```

**Response:**
```json
{
  "score": 85,
  "verdict": "good",
  "suggestions": [
    { "field": "description", "issue": "too_short", "suggestion": "..." }
  ]
}
```

---

## Payment Endpoints

### POST `/create-checkout-session`
Create a Stripe checkout session for orders.

**Auth Required:** Yes

**Request Body:**
```json
{
  "orderId": "uuid",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

---

### POST `/create-property-deposit-checkout`
Create checkout for property security deposits.

**Auth Required:** Yes

**Request Body:**
```json
{
  "bookingId": "uuid",
  "amount": 5000,
  "currency": "THB"
}
```

---

### POST `/stripe-webhook`
Stripe webhook handler for payment events.

**Auth Required:** No (verified via webhook signature)

**Headers Required:**
- `stripe-signature`: Stripe webhook signature

---

### POST `/create-vendor-subscription`
Create vendor subscription checkout.

**Auth Required:** Yes (Vendor role required)

**Request Body:**
```json
{
  "planId": "pro|business",
  "interval": "month|year"
}
```

---

## Booking & Calendar Endpoints

### POST `/booking-reminders`
Trigger booking reminder notifications.

**Auth Required:** Service role only

---

### GET `/calendar-export`
Export property calendar as iCal format.

**Query Parameters:**
- `propertyId` (required): Property UUID
- `token` (required): Export token

**Response:** `text/calendar` iCal file

---

### POST `/ical-sync`
Sync external calendars for properties.

**Auth Required:** Service role only

**Request Body:**
```json
{
  "propertyId": "uuid" // Optional, syncs all if omitted
}
```

---

## Notification Endpoints

### POST `/notify-admin-order`
Send order notification to admin team.

**Request Body:**
```json
{
  "orderId": "uuid",
  "type": "new|updated|cancelled"
}
```

---

### POST `/notify-admin-property-submission`
Notify admins of new property submission.

**Request Body:**
```json
{
  "propertyId": "uuid"
}
```

---

### POST `/send-order-email`
Send order confirmation email to customer.

**Request Body:**
```json
{
  "orderId": "uuid",
  "template": "confirmation|receipt|reminder"
}
```

---

### POST `/send-promotions`
Send promotional emails (admin only).

**Request Body:**
```json
{
  "campaignId": "uuid",
  "userSegment": "all|active|dormant"
}
```

---

## Utility Endpoints

### GET `/get-mapbox-token`
Get Mapbox public token for map rendering.

**Auth Required:** No (Public)

**Response:**
```json
{
  "token": "pk.eyJ1..."
}
```

---

### GET `/get-weather`
Get current weather for location.

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude

**Response:**
```json
{
  "temperature": 32,
  "condition": "sunny",
  "humidity": 75
}
```

---

### POST `/image-resize`
Get optimized image URL parameters.

**Request Body:**
```json
{
  "url": "https://...",
  "width": 800,
  "quality": 80
}
```

---

### POST `/generate-booking-voucher`
Generate PDF voucher for booking.

**Auth Required:** Yes

**Request Body:**
```json
{
  "bookingId": "uuid"
}
```

---

## Vendor Endpoints

### POST `/vendor-portal`
Vendor dashboard API gateway.

**Auth Required:** Yes (Vendor role required)

**Request Body:**
```json
{
  "action": "getStats|getOrders|updateProduct",
  "data": {}
}
```

---

### POST `/check-vendor-subscription`
Check vendor subscription status.

**Auth Required:** Yes

**Response:**
```json
{
  "isActive": true,
  "plan": "pro",
  "expiresAt": "2025-12-31T00:00:00Z"
}
```

---

### POST `/bulk-import`
Bulk import products/services for vendors.

**Auth Required:** Yes (Vendor role required)

**Request Body:**
```json
{
  "type": "products|tours|services",
  "data": [...]
}
```

---

## Admin Endpoints

### POST `/intake-listing-agent`
AI-assisted listing intake for admins.

**Auth Required:** Yes (Admin role required)

**Request Body:**
```json
{
  "rawInput": "string",
  "inputMode": "text|excel|images"
}
```

---

### POST `/leads-factory`
Lead generation and management.

**Auth Required:** Yes (Admin role required)

---

### POST `/vendor-acquisition`
AI-powered vendor acquisition pipeline.

**Auth Required:** Yes (Admin/UNO Team role required)

**Request Body:**
```json
{
  "action": "scrape|score|generate-pitch",
  "data": {}
}
```

---

### POST `/firecrawl-scrape`
Web scraping for vendor acquisition.

**Auth Required:** Yes (Admin role required)

**Request Body:**
```json
{
  "url": "https://...",
  "type": "instagram|facebook|google_maps"
}
```

---

### GET `/user-analytics-api`
User analytics data export.

**Auth Required:** Yes (Admin role required)

**Query Parameters:**
- `days`: Number of days (default: 30)
- `segment`: User segment filter

---

### POST `/calculate-metrics`
Trigger metrics calculation job.

**Auth Required:** Service role only

---

### POST `/calculate-advanced-metrics`
Calculate advanced cohort and retention metrics.

**Auth Required:** Service role only

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "code": "ERROR_CODE"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## CORS

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

Preflight `OPTIONS` requests are handled automatically.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-31 | Initial documentation |

---

## Support

For API issues or questions, contact: `api@uno.phuket`

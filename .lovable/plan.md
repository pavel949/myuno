

# Owner Portal: 5 Features Implementation

## 1. Real-time Chat (Owner <-> MC)

**Database:** New `portal_messages` table with realtime enabled.

```text
portal_messages
  id uuid PK
  property_id uuid FK -> properties
  sender_id uuid FK -> auth.users
  sender_role text ('owner' | 'mc')
  message text
  is_read boolean DEFAULT false
  created_at timestamptz
```

RLS: owner reads/writes own messages; MC members (via `management_company_members`) read/write for their properties.

**Frontend:**
- New `usePortalChat(propertyId)` hook -- fetches messages, subscribes to realtime `postgres_changes`, sends messages
- New `PortalChatTab` component replacing the placeholder in `OwnerPortalPropertyView.tsx` (tab "messages")
- Simple message list + input UI (bubble layout, timestamps, read indicators)
- MC side: add "Messages" section to `OwnerPortalSettingsPage` or property command center showing unread count

## 2. Owner Stays (Zero-Price Calendar Blocking)

**Logic:** Insert into existing `property_bookings` table with `source = 'owner_stay'`, `total_amount = 0`, `guest_name = 'Owner Stay'`.

**Frontend:**
- New `OwnerStaysTab` component replacing placeholder in `OwnerPortalPropertyView.tsx` (tab "stays")
- Date range picker (check_in / check_out) with availability validation against existing bookings
- List of upcoming and past owner stays with cancel option
- Hook `useOwnerStays(propertyId)` -- queries `property_bookings` filtered by `source = 'owner_stay'`

**No new table needed** -- reuses `property_bookings` with a distinguishing `source` value.

## 3. Utilities Tab (PEA/CAM Bills)

**Frontend:**
- New `PortalUtilitiesTab` component replacing placeholder in `OwnerPortalPropertyView.tsx`
- Reads from existing `property_financials` table, filtered by categories: `electricity`, `water`, `cam_fees`, `internet`
- Displays grouped by month with amount, due date, status (paid/pending/overdue)
- Uses existing `property_utility_schedules` for recurring schedule display
- Read-only for owner; data entry remains on MC side

## 4. Documents Tab (CRM Vault -> Portal)

**Frontend:**
- New `PortalDocumentsTab` component replacing placeholder in `OwnerPortalPropertyView.tsx`
- Reads from existing `crm_documents` table filtered by `property_id`
- Uses `getDocumentUrl()` from `useCrmDocuments.ts` for signed download URLs
- Grouped by `document_type` with labels from `DOCUMENT_TYPE_LABELS`
- Owner can view/download but not upload (read-only)
- Respects `show_documents` toggle from portal settings

## 5. "Portal Settings" Button on Property Card in PMS

**Frontend:**
- Add `Eye` icon button to `PropertyQuickActions.tsx` linking to `/owner/properties/${propertyId}/portal-settings`
- Label: "Portal" / "Портал"

---

## Technical Summary

| Feature | New Table | New Components | Modified Files |
|---------|-----------|----------------|----------------|
| Chat | `portal_messages` | `PortalChatTab`, `usePortalChat` | `OwnerPortalPropertyView.tsx` |
| Owner Stays | None (reuses `property_bookings`) | `OwnerStaysTab`, `useOwnerStays` | `OwnerPortalPropertyView.tsx` |
| Utilities | None (reads `property_financials`) | `PortalUtilitiesTab` | `OwnerPortalPropertyView.tsx` |
| Documents | None (reads `crm_documents`) | `PortalDocumentsTab` | `OwnerPortalPropertyView.tsx` |
| Portal Button | None | -- | `PropertyQuickActions.tsx` |

**Migration:** One SQL migration for `portal_messages` table + RLS + realtime publication.

**Files to create:**
- `src/hooks/usePortalChat.ts`
- `src/hooks/useOwnerStays.ts`
- `src/components/owner-portal/PortalChatTab.tsx`
- `src/components/owner-portal/OwnerStaysTab.tsx`
- `src/components/owner-portal/PortalUtilitiesTab.tsx`
- `src/components/owner-portal/PortalDocumentsTab.tsx`

**Files to modify:**
- `src/pages/owner-portal/OwnerPortalPropertyView.tsx` -- replace 4 placeholder tabs with real components
- `src/components/owner/property-detail/PropertyQuickActions.tsx` -- add Portal Settings button


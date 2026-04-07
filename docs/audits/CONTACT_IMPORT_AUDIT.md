# Contacts Section — Code Audit

**Date:** 2025-03-11  
**Scope:** Contact import flow + full contacts block (list, detail, hooks, import).

## Contacts block fixes (list/detail/hooks)

- **useCrmContacts:** Removed embedded `agent_deals(id)` from the select. That relation could fail if the FK was not exposed in the API; the list now uses `select('*', { count: 'exact' })` and sets `deal_count` to 0 for each row. This prevents the contacts list from failing to load.
- **ContactsList:** Added `isError` / `error` handling; shows a clear message and error text when the contacts query fails. Uses `result?.data ?? []` and `result?.count ?? 0` for safe defaults. Replaced `(contact as any).lifecycle_stage` with `contact.lifecycle_stage ?? 'lead'`.
- **ContactDetail:** Added `isError` handling with a message and “Back to contacts” button. All navigations to the contacts list now use `APP_ROUTES.MC_CONTACTS` instead of hardcoded `'/mc/contacts'`.

---

## Contact Import (original audit)

---

## Summary

Audit of the contact import code identified and fixed several issues that could cause runtime errors or failed imports. All fixes are backward-compatible.

---

## Components

| Component | Role |
|-----------|------|
| **ContactImportPage** | Full-page import at `/mc/contacts/import`: file (CSV/TSV/XLSX/vCard), messenger paste, manual entry. |
| **ContactImportSheet** | Modal import from ContactsList: CSV only, column mapping, batch insert. |
| **parseSpreadsheet** | Shared parser for CSV, TSV, XLSX. Used by ContactImportPage. |
| **contactsImportFields** | Field config and aliases for auto-mapping. |
| **contactsImportI18n** | RU/EN strings for import UI. |

---

## Issues Found and Fixed

### 1. ContactImportPage — Select value and loading/error states

**Issue:**  
- Radix Select was used with `value=""` when no column was mapped. Some versions of Radix Select do not handle empty string as a valid value and can throw or behave incorrectly.  
- No loading or error handling for `useMyCompanyId()`. If the query was loading or failed, the form could render with `companyId === undefined` and cause confusing or broken behavior.

**Fix:**  
- Introduced a sentinel value `SKIP_COLUMN = '_skip'` for “no column” and use it in `value` and `SelectItem` instead of `""`.  
- Added loading UI while `companyLoading` is true.  
- Added explicit “company not found” state when `companyId` is missing after load (with short guidance).

### 2. ContactImportSheet — Insert payload and empty batch

**Issue:**  
- Row filter logic was correct but hard to read; no explicit guard for “no rows with a name”.  
- Insert could be called with an empty array if every row was filtered out (no rows with first or last name).

**Fix:**  
- Clarified filter: keep row if `first !== ''` or `(last !== '' && last !== '-')`.  
- Wrapped `row[csvCol]` in `String(...)` for safety.  
- If `rows.length === 0` after filtering, skip insert, show a clear toast, and return without moving to “done” step.

### 3. ContactImportPage — Defensive parsing (already present)

**Existing:**  
- `buildRowFromMapping(rawRows[i] ?? {})` and safe handling of `parsed[i]` with `String(c?.first_name ?? '').trim()` etc. are in place.  
- No further changes needed for this audit.

---

## Data Flow (ContactImportPage)

1. **File (CSV/TSV/XLSX):** `parseSpreadsheetFile` → `headers` + `rows` → `handleSpreadsheetResult` → auto-map from `CONTACT_IMPORT_ALIASES` → `applyMapping` → `parsed` + `rawRows` + `columnMapping`.  
2. **Import:** If `rawRows.length > 0` → build from `rawRows` via `buildRowFromMapping`; else build from `parsed`.  
3. **Insert:** Batches of 50 to `crm_contacts` with `company_id`, `created_by`, and mapped fields.

**Invariants:**  
- `parsed` and `rawRows` are same length when source is spreadsheet.  
- `validIndices` are indices into `parsed`; for CSV we use `rawRows[i]` for the same index.  
- `companyId` and `user` are checked before any insert.

---

## Data Flow (ContactImportSheet)

1. **Upload:** Papa.parse CSV → `rawData`, `columns` → `autoMap(columns)` → `mapping` (column name → field key).  
2. **Import:** For each row, build object from `mapping` (csvCol → targetField), apply length limits, then filter to rows with at least one name.  
3. **Insert:** Batches of 50 to `crm_contacts`; empty batch is no longer sent.

---

## Database (crm_contacts)

- **Required for insert:** `company_id`.  
- **Effectively required in use:** `first_name` and/or `last_name` (we filter so at least one is non-empty; default `last_name` is `'-'` when not mapped).  
- **Optional:** phone, email, whatsapp, telegram, notes, tags, is_archived, etc.  
- Length limits applied in code: first/last name 100, phone/whatsapp 20, email 255, telegram/line_id 50, notes 500.

---

## Recommendations

1. **Error reporting:** Consider logging insert errors (e.g. via existing logger) in addition to toast for easier debugging.  
2. **Tests:** Add unit tests for `applyMapping`, `buildRowFromMapping`, and the Sheet’s row-building + filter logic with edge cases (empty rows, only last name, only first name).  
3. **parseSpreadsheet:** If a CSV has no header row and Papa returns `meta.fields = []`, rows become `[{}]`. Current behavior (one empty/invalid row) is acceptable; document or add a small comment if this case should be treated differently.

---

## Files Touched in This Audit

- `src/pages/owner/ContactImportPage.tsx` — Select sentinel, loading/error states.  
- `src/components/owner/contacts/ContactImportSheet.tsx` — Filter clarity, empty-batch guard, safe `String()` on cell values.  
- `docs/audits/CONTACT_IMPORT_AUDIT.md` — This audit.

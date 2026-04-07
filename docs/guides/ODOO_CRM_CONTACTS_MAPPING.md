# Odoo ↔ myUNO CRM Contacts — Field Mapping

Basic setup so that CRM contacts can be **imported from** and **exported for** Odoo with minimal manual mapping.

## Reference

- **myUNO:** `crm_contacts` table, import/export in Contacts list and Contact Import page.
- **Odoo:** `res.partner` model (Contacts / Partners). CSV export uses technical or translated column names.

## Mapping (basic)

| Odoo res.partner (CSV column) | myUNO crm_contacts |
|-------------------------------|--------------------|
| `name` / `contact name`      | first_name (or split name → first/last) |
| `firstname`                   | first_name |
| `lastname` / `surname`        | last_name |
| `email`                       | email |
| `phone` / `telephone`         | phone |
| `mobile`                      | mobile |
| `street` / `address`          | address_street |
| `street2`                     | address_street2 |
| `city`                        | address_city |
| `state_id` / `state`          | address_state |
| `zip` / `postal`              | address_zip |
| `country_id` / `country`      | address_country |
| `website`                     | website |
| `comment` / `notes`           | notes |
| `function`                    | job_title |
| `parent_id` / `company`       | company_name |
| `lang`                        | language |
| `vat`                         | tax_id |
| `birthdate`                   | birthday |

## Import (Odoo → myUNO)

1. In Odoo: **Contacts** → list view → **Favorites** → **Export** (or **Import/Export**). Choose fields that match the table above and export as CSV.
2. In myUNO: **Контакты** → **Импорт контактов** (or **Contact Import** page). Upload the Odoo CSV.
3. Column headers are auto-mapped using `CONTACT_IMPORT_ALIASES` in `src/lib/contactsImportFields.ts`, which includes Odoo technical names and common labels (`street`, `function`, `comment`, `parent_id`, etc.). Adjust mapping in the UI if needed, then run import.

For programmatic conversion from an Odoo-shaped row to myUNO keys, use `odooRowToMyUnoKeys()` from `src/lib/odooContactMapping.ts`.

## Export (myUNO → Odoo)

1. In myUNO: **Контакты** → **CSV** dropdown → **CSV для Odoo** (or **CSV for Odoo**).
2. The file is generated with Odoo-friendly column names: `firstname`, `lastname`, `name`, `email`, `phone`, `mobile`, `street`, `street2`, `city`, `zip`, `country_id`, `website`, `function`, `parent_id`, `comment`, `lang`, `vat`, `birthdate`.
3. In Odoo: **Contacts** → **Import**, select the CSV and map columns to `res.partner` (columns should match; map `parent_id` to company if you use company names).

## Code

- **Mapping and aliases:** `src/lib/odooContactMapping.ts` — `ODOO_TO_MYUNO`, `MYUNO_TO_ODOO`, `odooRowToMyUnoKeys()`.
- **Import aliases:** `src/lib/contactsImportFields.ts` — `CONTACT_IMPORT_ALIASES` (includes Odoo column names).
- **Export for Odoo:** `src/components/owner/contacts/ContactExportButton.tsx` — “CSV for Odoo” uses `contactToOdooRow()` to build Odoo-shaped rows.

## Notes

- Odoo often exports a single **name**; myUNO uses **first_name** and **last_name**. On import, “name” is mapped to first_name; you may want to split “Lastname Firstname” in Odoo or in a spreadsheet before import.
- **country_id** / **state_id** in Odoo are often IDs or external IDs; myUNO stores names. Export from myUNO uses country/state names; for Odoo import you may need to map names back to IDs or use Odoo’s name-based import.
- Custom or extra fields (e.g. tags, lifecycle stage) can be put in `comment` for round-trip or handled via custom Odoo fields and mapping.

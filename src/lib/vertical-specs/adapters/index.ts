/**
 * Resolves the correct DB ↔ form adapter for a given vertical id.
 * Restaurant uses a bespoke adapter (legacy DB columns); everything else
 * goes through the generic listingsAdapter.
 */
import { dbToForm as restaurantDbToForm, formToDb as restaurantFormToDb } from './restaurantAdapter';
import { listingsDbToForm, listingsFormToDb } from './listingsAdapter';

type DbRow = Record<string, unknown>;
type FormRow = Record<string, unknown>;

export function adapterDbToForm(vertical: string, db: DbRow): FormRow {
  if (vertical === 'restaurant') return restaurantDbToForm(db);
  return listingsDbToForm(db);
}

export function adapterFormToDb(vertical: string, form: FormRow): DbRow {
  if (vertical === 'restaurant') return restaurantFormToDb(form, vertical);
  return listingsFormToDb(form, vertical);
}

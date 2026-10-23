import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type SystemSettingRow = { key: string; value: Json; description?: string };
export type AssertSettingsActor = () => void;
const unconfirmed = () => new Error('Settings save was not confirmed. Reload settings before retrying.');

export async function readAdminSystemSettings(keys: readonly string[], assertCurrent: AssertSettingsActor): Promise<SystemSettingRow[]> {
  assertCurrent();
  const { data, error } = await supabase.from('system_settings').select('key, value').in('key', [...keys]);
  assertCurrent();
  if (error) throw error;
  if (!Array.isArray(data) || new Set(data.map(row => row.key)).size !== data.length || data.some(row => !keys.includes(row.key))) throw new Error('Settings could not be verified.');
  return data;
}

function assertSavedRows(expected: SystemSettingRow[], actual: SystemSettingRow[] | null) {
  if (!Array.isArray(actual) || actual.length !== expected.length || new Set(actual.map(row => row.key)).size !== expected.length
    || expected.some(row => !actual.some(saved => saved.key === row.key && JSON.stringify(saved.value) === JSON.stringify(row.value)))) throw unconfirmed();
}

/** One batch write, exact returned rows, then persisted readback. No raw fallback. */
export async function saveAdminSystemSettings(rows: SystemSettingRow[], assertCurrent: AssertSettingsActor): Promise<SystemSettingRow[]> {
  if (!rows.length || new Set(rows.map(row => row.key)).size !== rows.length) throw unconfirmed();
  assertCurrent();
  const { data, error } = await supabase.from('system_settings').upsert(rows, { onConflict: 'key' }).select('key, value');
  assertCurrent();
  if (error) throw error;
  assertSavedRows(rows, data);
  const persisted = await readAdminSystemSettings(rows.map(row => row.key), assertCurrent);
  assertSavedRows(rows, persisted);
  return persisted;
}

/** REST archive helpers. These do not certify a database disaster-recovery backup. */
export function assertImportableSummary(summary) {
  if (!summary || summary.snapshotKind !== 'verified-table-export' || summary.sourceVisibility !== 'complete'
    || summary.tablesWithErrors !== 0 || !Array.isArray(summary.details?.exported)) {
    throw new Error('Import refused: archive completeness is unverified. Public/RLS-filtered exports are not restore sources.');
  }
}

export async function importRows(client, table, rows, batchSize = 500) {
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error('Invalid table rows.');
  }
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('Invalid batch size.');
  let applied = 0;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
    if (error) {
      // A transport failure can have committed. Never fall back to a second insert.
      throw new Error(`Import stopped for ${table} after ${applied} acknowledged rows; current batch outcome unverified.`, { cause: error });
    }
    applied += batch.length;
  }
  return { table, applied };
}

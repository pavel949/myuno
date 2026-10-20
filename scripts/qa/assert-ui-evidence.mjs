import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function assertUiEvidence(rows, expected) {
  const languages = ['ru', 'en', 'th'];
  const matrix = [];
  const key = row => expected === 18 ? [row.language, row.width, row.state].join('|') : [row.language, row.width, row.scenario, row.role].join('|');
  if (expected === 18) {
    for (const language of languages) for (const width of [320, 2560]) for (const state of ['full', 'all-zero', 'total-source-failure']) matrix.push({language, width, state});
  } else if (expected === 60) {
    for (const language of languages) {
      for (const width of [375, 768, 1280, 1920]) for (const scenario of ['full', 'one-source-failure', 'stale', 'no-snapshots']) matrix.push({language, width, scenario, role: 'admin'});
      for (const width of [375, 1280]) for (const role of ['staff', 'unauthorized']) matrix.push({language, width, scenario: 'full', role});
    }
  } else throw Error('Unsupported evidence matrix');
  const keys = new Set(matrix.map(key));
  if (!Array.isArray(rows) || rows.length !== expected || new Set(rows.map(key)).size !== expected || rows.some(row => !keys.has(key(row)) || row.outcome !== 'PASS')) throw Error('Incomplete, duplicate, unexpected or failed UI matrix');
  for (const row of rows) {
    const geometry = row.geometry;
    if (!geometry || geometry.viewport !== row.width || geometry.documentWidth > row.width || !Array.isArray(geometry.bad) || geometry.bad.length) throw Error('Missing or invalid geometry evidence');
    if (expected === 18) {
      if (!row.actualShell || !row.actualAdminLayout) throw Error('Actual AdminLayout evidence missing');
      if (row.width === 320 && (!Array.isArray(geometry.touchTargets) || geometry.touchTargets.length < 5 || geometry.touchTargets.some(target => target.width < 44 || target.height < 44))) throw Error('Missing mobile target evidence');
      if (row.state === 'full') {
        for (const flag of ['searchFocusReturned', 'dashboardSearchKeptFocus', 'avatarFocusReturned', 'singleCommandDialog', 'commandFocusReturned']) if (row.keyboard?.[flag] !== true) throw Error('Missing keyboard evidence: ' + flag);
        if (row.width === 320 && row.keyboard?.preferencesFocusReturned !== true) throw Error('Missing mobile preferences evidence');
        if (row.navigation?.uniqueActualRoutes !== 74 || row.navigation?.renderedMenuButtons !== 74 || row.navigation?.singleActiveToday !== true || row.afterInteractionGeometry?.viewport !== row.width || row.afterInteractionGeometry?.bad?.length !== 0) throw Error('Missing navigation evidence');
      }
    } else if (row.role === 'admin') {
      if (!row.proof?.counts || !row.proof?.destinations || !row.proof?.snapshotCells || !row.proof?.platformStatuses) throw Error('Missing source-state evidence');
      for (const count of ['pendingContent', 'pendingListings', 'pendingProperties', 'pendingProviders', 'pendingOrders', 'openTickets', 'pendingManualPayments', 'pendingPartnerApplications', 'openDisputes']) if (!row.proof.counts[count]) throw Error('Missing queue evidence: ' + count);
      if (row.proof.destinations.length !== 6 || row.proof.snapshotCells.length !== 3 || row.proof.platformStatuses.length !== 6) throw Error('Incomplete source-state evidence');
      const destinations = ['/admin/providers?filter=unverified', '/admin/operations?tab=bookings&status=pending', '/admin/tickets?status=active', '/admin/operations?tab=manual-payments&manual_status=review', '/admin/properties?action=new', '/admin/services?action=new'];
      if (new Set(row.proof.destinations).size !== 6 || destinations.some(href => !row.proof.destinations.includes(href))) throw Error('Missing destination evidence');
      if (row.scenario === 'one-source-failure' && (row.proof.counts.pendingProviders.state !== 'unavailable' || row.proof.counts.pendingProviders.value !== null)) throw Error('Unavailable source became zero');
      if (row.scenario === 'full') {
        const interaction = row.interactions;
        if (interaction?.period !== 30 || interaction?.linkPushAndMemoryHistory !== '/admin/providers?filter=unverified') throw Error('Missing interaction evidence');
        for (const source of ['stats', 'health', 'snapshots']) if (!Number.isInteger(interaction.singleFlight?.before?.[source]) || interaction.singleFlight.after?.[source] !== interaction.singleFlight.before[source] + 1) throw Error('Missing single-flight evidence');
      }
    } else if (row.accessProof?.noPlatformReads !== true || row.accessProof?.noPlatformHooks !== true) throw Error('Missing access boundary evidence');
  }
  return rows.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, expectedRaw] = process.argv.slice(2);
  const rows = JSON.parse(await readFile(file, 'utf8'));
  console.log(`Verified ${assertUiEvidence(rows, Number(expectedRaw))} unique UI cases with required evidence`);
}

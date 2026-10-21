import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertUiEvidence } from './assert-ui-evidence.mjs';

function shellRows() {
  return ['ru', 'en', 'th'].flatMap(language => [320, 2560].flatMap(width => ['full', 'all-zero', 'total-source-failure'].map(state => ({
    language, width, state, outcome: 'PASS', actualShell: true, actualAdminLayout: true,
    geometry: {viewport: width, documentWidth: width, bad: [], touchTargets: Array.from({length: 5}, () => ({width: 44, height: 44}))},
    keyboard: {searchFocusReturned: true, dashboardSearchKeptFocus: true, avatarFocusReturned: true, singleCommandDialog: true, commandFocusReturned: true, preferencesFocusReturned: true, commands: Object.fromEntries(['ctrl', 'meta'].map(modifier => [modifier, {ready: {dialog: {state: 'open', containsFocus: true, animations: []}}, dismissed: true, focusReturned: true, closed: {dialogs: []}}]))},
    navigation: {uniqueActualRoutes: 74, renderedMenuButtons: 74, singleActiveToday: true}, afterInteractionGeometry: {viewport: width, bad: []},
  }))));
}
test('accepts a complete unique shell matrix with interaction evidence', () => assert.equal(assertUiEvidence(shellRows(), 18), 18));
test('rejects duplicate rows despite correct case count', () => { const rows = shellRows(); rows[17] = rows[0]; assert.throws(() => assertUiEvidence(rows, 18), /duplicate/); });
test('rejects missing required keyboard proof', () => { const rows = shellRows(); delete rows[0].keyboard.commandFocusReturned; assert.throws(() => assertUiEvidence(rows, 18), /keyboard/); });
test('requires both settled shortcut iterations with dismissal/focus proof', () => { const rows = shellRows(); delete rows[0].keyboard.commands.meta; assert.throws(() => assertUiEvidence(rows, 18), /command interaction/); });
test('rejects a still-animating command portal', () => { const rows = shellRows(); rows[0].keyboard.commands.ctrl.ready.dialog.animations.push({pending: true, state: 'running'}); assert.throws(() => assertUiEvidence(rows, 18), /command interaction/); });
test('rejects a dialog remaining after Escape despite success booleans', () => { const rows = shellRows(); rows[0].keyboard.commands.meta.closed.dialogs.push({state: 'open'}); assert.throws(() => assertUiEvidence(rows, 18), /command interaction/); });
test('rejects partial/failed matrices', () => { const rows = shellRows(); assert.throws(() => assertUiEvidence(rows.slice(1), 18)); rows[0].outcome = 'FAIL'; assert.throws(() => assertUiEvidence(rows, 18)); });
test('rejects unexpected matrix keys', () => { const rows = shellRows(); rows[0].width = 375; assert.throws(() => assertUiEvidence(rows, 18)); });
test('rejects missing actual layout and small mobile targets', () => { const rows = shellRows(); rows[0].actualAdminLayout = false; assert.throws(() => assertUiEvidence(rows, 18)); rows[0].actualAdminLayout = true; rows[0].geometry.touchTargets[0].width = 32; assert.throws(() => assertUiEvidence(rows, 18), /target/); });

function dashboardRows() {
  const rows = [];
  for (const language of ['ru', 'en', 'th']) {
    for (const width of [375, 768, 1280, 1920]) for (const scenario of ['full', 'one-source-failure', 'stale', 'no-snapshots']) rows.push({language, width, scenario, role: 'admin'});
    for (const width of [375, 1280]) for (const role of ['staff', 'unauthorized']) rows.push({language, width, scenario: 'full', role});
  }
  return rows.map(row => ({...row, outcome: 'PASS', geometry: {viewport: row.width, documentWidth: row.width, bad: []},
    proof: {counts: Object.fromEntries(['pendingContent', 'pendingListings', 'pendingProperties', 'pendingProviders', 'pendingOrders', 'openTickets', 'pendingManualPayments', 'pendingPartnerApplications', 'openDisputes'].map(key => [key, {value: row.scenario === 'one-source-failure' && key === 'pendingProviders' ? null : 1, state: row.scenario === 'one-source-failure' && key === 'pendingProviders' ? 'unavailable' : 'ready'}])), destinations: ['/admin/providers?filter=unverified', '/admin/operations?tab=bookings&status=pending', '/admin/tickets?status=active', '/admin/operations?tab=manual-payments&manual_status=review', '/admin/properties?action=new', '/admin/services?action=new'], snapshotCells: ['0', '0', '0'], platformStatuses: Array(6).fill('fixture')},
    interactions: {period: 30, linkPushAndMemoryHistory: '/admin/providers?filter=unverified', singleFlight: {before: {stats: 1, health: 1, snapshots: 1}, after: {stats: 2, health: 2, snapshots: 2}}},
    accessProof: {noPlatformReads: true, noPlatformHooks: true},
  }));
}
test('accepts the complete dashboard matrix', () => assert.equal(assertUiEvidence(dashboardRows(), 60), 60));
test('rejects omitted full-state interactions', () => { const rows = dashboardRows(); delete rows[0].interactions; assert.throws(() => assertUiEvidence(rows, 60), /interaction/); });
test('rejects omitted staff access proof', () => { const rows = dashboardRows(); delete rows.find(row => row.role === 'staff').accessProof; assert.throws(() => assertUiEvidence(rows, 60), /access/); });
test('rejects duplicate dashboard matrix keys', () => { const rows = dashboardRows(); rows[59] = rows[0]; assert.throws(() => assertUiEvidence(rows, 60), /duplicate/); });

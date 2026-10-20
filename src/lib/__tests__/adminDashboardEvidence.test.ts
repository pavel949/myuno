import { describe, expect, it } from 'vitest';
import { configurationStatus, dashboardSnapshotPeriod, summarizeDashboardSnapshots, verticalConfigurationStatus } from '../adminDashboardEvidence';

describe('dashboard snapshot evidence', () => {
  it('uses completed Phuket calendar days across the UTC day boundary', () => {
    expect(dashboardSnapshotPeriod(7, new Date('2026-10-19T19:00:00Z'))).toEqual({
      days: 7, from: '2026-10-13', through: '2026-10-19',
      dates: ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'],
    });
  });
  it('does not fabricate zeros for absent or partial snapshots', () => {
    const dates = ['2026-10-18', '2026-10-19'];
    expect(summarizeDashboardSnapshots([], dates)).toEqual({ coverage: 0, complete: false, gmv: null, platformRevenue: null, completedBookings: null });
    expect(summarizeDashboardSnapshots([{ date: dates[0], gmv: 50, platform_revenue: 5, completed_bookings: 1 }], dates).gmv).toBeNull();
  });
  it('keeps GMV and platform revenue distinct and accepts a verified zero', () => {
    expect(summarizeDashboardSnapshots([
      { date: '2026-10-18', gmv: 120, platform_revenue: 7, completed_bookings: 1 },
      { date: '2026-10-19', gmv: 0, platform_revenue: 0, completed_bookings: 0 },
    ], ['2026-10-18', '2026-10-19'])).toEqual({ coverage: 2, complete: true, gmv: 120, platformRevenue: 7, completedBookings: 1 });
  });
  it('rejects duplicate days and missing individual monetary fields', () => {
    const row = { date: '2026-10-18', gmv: 0, platform_revenue: null, completed_bookings: 0 };
    expect(summarizeDashboardSnapshots([row, row], [row.date]).gmv).toBeNull();
    expect(summarizeDashboardSnapshots([row], [row.date])).toMatchObject({ complete: true, gmv: 0, platformRevenue: null });
  });
});

describe('configuration is distinct from delivery verification', () => {
  it('does not mark missing or malformed vertical configuration green', () => {
    expect(verticalConfigurationStatus([])).toBe('unknown');
    expect(verticalConfigurationStatus(null)).toBe('unknown');
    expect(verticalConfigurationStatus([{ value: '{bad' }])).toBe('unknown');
    expect(verticalConfigurationStatus([{ value: '{"enabled":true}' }, { value: 'unknown' }])).toBe('unknown');
    expect(verticalConfigurationStatus([{ value: '{"enabled":false}' }])).toBe('not_configured');
    expect(verticalConfigurationStatus([{ value: '{"enabled":true}' }])).toBe('configured');
  });
  it('reports only the setting evidence supplied', () => {
    expect(configurationStatus('live', 'stripe')).toBe('configured');
    expect(configurationStatus('test', 'stripe')).toBe('not_configured');
    expect(configurationStatus('["admin@example.invalid"]', 'email')).toBe('configured');
    expect(configurationStatus('["not-an-email"]', 'email')).toBe('not_configured');
    expect(configurationStatus(null, 'whatsapp')).toBe('not_configured');
  });
});

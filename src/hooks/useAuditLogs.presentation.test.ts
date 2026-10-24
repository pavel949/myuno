import { expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { formatAuditAction } from './useAuditLogs';
it('keeps destructive, warning and informational actions semantically distinct', () => {
  expect(formatAuditAction('delete_property')).toEqual({ label: 'Удаление', color: 'bg-danger/10 text-danger' });
  expect(formatAuditAction('suspend')).toEqual({ label: 'Приостановка', color: 'bg-warning/10 text-warning' });
  expect(formatAuditAction('update')).toEqual({ label: 'Изменение', color: 'bg-info/10 text-info' });
  expect(formatAuditAction('approve')).toEqual({ label: 'Одобрение', color: 'bg-success/10 text-success' });
});
it('preserves unknown action text with neutral theme-aware styling', () => {
  expect(formatAuditAction('custom_external_event')).toEqual({ label: 'custom_external_event', color: 'bg-muted text-muted-foreground' });
});

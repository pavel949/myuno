import { describe, expect, it } from 'vitest';
import { getActiveBottomBarItem, getBottomBarItems } from './navigationModel';

describe('short-stay hosting navigation', () => {
  it('uses the existing MC routes in task order, not a second workspace', () => {
    expect(getBottomBarItems('owner').map(item => item.path)).toEqual([
      '/mc/today', '/mc/calendar', '/mc/properties', '/mc/messages', '/mc/modules',
    ]);
  });

  it.each([
    ['/mc/today', '/mc/today'],
    ['/mc/bookings-list', '/mc/today'],
    ['/mc/tasks', '/mc/today'],
    ['/mc/rates/', '/mc/calendar'],
    ['/mc/properties/test/guidebook', '/mc/properties'],
    ['/mc/listings/test/edit', '/mc/properties'],
    ['/mc/chat/booking/test', '/mc/messages'],
    ['/mc/finance', '/mc/modules'],
    ['/mc', '/mc/modules'],
    ['/mc/settings', '/mc/modules'],
    ['/mcc', undefined],
  ])('highlights the task for %s', (path, tab) => {
    expect(getActiveBottomBarItem('owner', path)?.path).toBe(tab);
  });

  it('does not show the workspace in the owner portal or guest bar', () => {
    for (const role of ['mc_portal', 'guest'] as const) {
      expect(getBottomBarItems(role).every(item => item.path !== '/mc/today' && item.path !== '/mc/modules')).toBe(true);
      expect(getActiveBottomBarItem(role, '/mc/calendar')).toBeNull();
    }
  });
});

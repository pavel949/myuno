/**
 * useIntakeQueueHotkeys — keyboard navigation for the AI intake queue.
 *
 * Bindings (when no input/textarea is focused):
 *   ↑ / ↓        — move active selection between pending items
 *   A            — approve currently active item
 *   D            — discard currently active item
 *   E            — open editor for currently active item
 *   Shift + A    — approve all valid pending items
 *
 * The hook is intentionally headless: it doesn't render UI. The host component
 * supplies the ordered list of pending items and handler callbacks, and gets
 * back { activeId, setActiveId } to render visual focus (ring + scrollIntoView).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IntakeItem } from '@/hooks/useIntakeAgent';

interface UseIntakeQueueHotkeysOptions {
  /** Ordered list of currently visible pending items (active tab only). */
  items: IntakeItem[];
  /** Whether shortcuts should be active (e.g. only on the "pending" tab). */
  enabled: boolean;
  onApprove: (itemId: string) => void;
  onDiscard: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onApproveAll?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Radix dialog/sheet backdrops also trap keyboard — be defensive.
  if (target.closest('[role="dialog"] input, [role="dialog"] textarea')) return true;
  return false;
}

export function useIntakeQueueHotkeys({
  items,
  enabled,
  onApprove,
  onDiscard,
  onEdit,
  onApproveAll,
}: UseIntakeQueueHotkeysOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Keep activeId in sync with the items list — drop stale ids, default to first.
  useEffect(() => {
    if (!enabled) return;
    if (items.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId(prev => (prev && items.some(i => i.id === prev) ? prev : items[0].id));
  }, [items, enabled]);

  const activeIndex = useMemo(
    () => (activeId ? items.findIndex(i => i.id === activeId) : -1),
    [items, activeId]
  );

  const move = useCallback(
    (delta: number) => {
      if (items.length === 0) return;
      const base = activeIndex >= 0 ? activeIndex : 0;
      const next = (base + delta + items.length) % items.length;
      setActiveId(items[next].id);
    },
    [items, activeIndex]
  );

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          move(1);
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          move(-1);
          break;
        case 'a':
        case 'A':
          if (e.shiftKey) {
            if (onApproveAll) {
              e.preventDefault();
              onApproveAll();
            }
          } else if (activeId) {
            e.preventDefault();
            onApprove(activeId);
          }
          break;
        case 'd':
        case 'D':
          if (activeId) {
            e.preventDefault();
            onDiscard(activeId);
          }
          break;
        case 'e':
        case 'E':
          if (activeId) {
            e.preventDefault();
            onEdit(activeId);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [enabled, activeId, move, onApprove, onDiscard, onEdit, onApproveAll]);

  // Auto-scroll active card into view.
  useEffect(() => {
    if (!enabled || !activeId) return;
    const el = document.querySelector<HTMLElement>(`[data-intake-card-id="${activeId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeId, enabled]);

  return { activeId, setActiveId };
}

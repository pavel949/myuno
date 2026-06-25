/**
 * useHotkey — minimal global keyboard hotkey hook.
 *
 * Listens on `window`. Skips when focus is inside editable surfaces
 * (input/textarea/contenteditable/select) to avoid intercepting typing,
 * except when `allowInEditable` is set.
 *
 * Single-key match (case-insensitive) with optional modifiers.
 * For ⌘K on macOS and Ctrl+K on Windows/Linux pass `{ meta: true, ctrl: true }`
 * — both flags act as "either modifier counts".
 */
import { useEffect } from 'react';

export interface HotkeyOptions {
  /** Key to match (e.g. 'k', '/', 'Escape'). Case-insensitive. */
  key: string;
  /** Require Cmd / Meta. If both `meta` and `ctrl` true → either matches. */
  meta?: boolean;
  /** Require Ctrl. If both `meta` and `ctrl` true → either matches. */
  ctrl?: boolean;
  /** Require Shift. */
  shift?: boolean;
  /** Require Alt. */
  alt?: boolean;
  /** Fire even while focus is inside input/textarea/contenteditable. */
  allowInEditable?: boolean;
  /** Disable temporarily without unmounting. */
  enabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useHotkey(opts: HotkeyOptions, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    if (opts.enabled === false) return;
    const handle = (e: KeyboardEvent) => {
      if (!opts.allowInEditable && isEditableTarget(e.target)) return;
      if (e.key.toLowerCase() !== opts.key.toLowerCase()) return;

      const needMeta = !!opts.meta;
      const needCtrl = !!opts.ctrl;
      // If both meta and ctrl requested → accept either (cross-platform ⌘/Ctrl).
      if (needMeta && needCtrl) {
        if (!e.metaKey && !e.ctrlKey) return;
      } else {
        if (needMeta && !e.metaKey) return;
        if (needCtrl && !e.ctrlKey) return;
        if (!needMeta && e.metaKey) return;
        if (!needCtrl && e.ctrlKey) return;
      }
      if (!!opts.shift !== e.shiftKey) return;
      if (!!opts.alt !== e.altKey) return;
      handler(e);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opts.key,
    opts.meta,
    opts.ctrl,
    opts.shift,
    opts.alt,
    opts.allowInEditable,
    opts.enabled,
    handler,
  ]);
}

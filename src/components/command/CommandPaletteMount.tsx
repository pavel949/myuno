/**
 * CommandPaletteMount — global ⌘K / Ctrl+K / "/" listener.
 *
 * Mounted once near the App root. Lazy-renders the heavy CommandPalette
 * only after the user actually opens it (no cost when flag is OFF).
 *
 * Gated by feature_flag:command_palette via useFeatureFlag.
 */
import React, { useState, lazy, Suspense } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useHotkey } from '@/hooks/useHotkey';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

export const CommandPaletteMount: React.FC = () => {
  // DB flag `feature_flag:command_palette` is the global kill-switch.
  // While we observe internal feedback, client additionally restricts to
  // signed-in admins / uno_team. Drop the `isAdmin` guard at GA.
  const flag = useFeatureFlag('command_palette', false);
  const { isAdmin } = useIsAdmin();
  const enabled = flag && isAdmin;
  const [open, setOpen] = useState(false);

  useHotkey(
    { key: 'k', meta: true, ctrl: true, enabled },
    (e) => {
      e.preventDefault();
      setOpen((v) => !v);
    },
  );

  useHotkey(
    { key: '/', enabled },
    (e) => {
      e.preventDefault();
      setOpen(true);
    },
  );

  if (!enabled) return null;
  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Suspense>
  );
};

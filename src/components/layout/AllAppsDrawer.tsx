/**
 * AllAppsDrawer — thin compatibility wrapper around AppDrawer.
 *
 * Wave-1 IA cleanup (2026-06): два drawer-а (left-side AppDrawer и
 * bottom AllAppsDrawer) показывали один и тот же набор приложений
 * с расходящимся UX. Канонической точкой остался AppDrawer; этот файл
 * сохранён только для существующих импортов (BottomBar и т.п.) и просто
 * проксирует пропсы, подмешивая personas из хука.
 *
 * Новые импорты должны идти напрямую из `@/components/nav/AppDrawer`.
 *
 * @deprecated Use `AppDrawer` from `@/components/nav/AppDrawer`.
 */
import React from 'react';
import { AppDrawer } from '@/components/nav/AppDrawer';
import { useUserPersonas } from '@/hooks/useUserPersonas';

interface AllAppsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllAppsDrawer({ open, onOpenChange }: AllAppsDrawerProps) {
  const { personas } = useUserPersonas();
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      personas={personas}
    />
  );
}

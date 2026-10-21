/**
 * MapListBottomSheet — мобильный draggable sheet поверх карты с 3 snap-точками.
 *
 * Использует vaul напрямую (не shadcn Drawer), чтобы:
 *  - не было overlay (карта остаётся интерактивной);
 *  - работали snapPoints (peek/half/full).
 *
 * На desktop (≥lg) скрыт — список рендерится в обычной колонке вызывающим кодом.
 */
import * as React from 'react';
import { Drawer as Vaul } from 'vaul';
import { cn } from '@/lib/utils';

const SNAP_POINTS = ['120px', 0.5, 0.92] as const;

export interface MapListBottomSheetProps {
  /** Title shown in header (e.g. "51 локация"). */
  title: React.ReactNode;
  /** Optional right-side actions in header. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** Externally-controlled snap. When `selectedId` changes, parent can lift this to "half". */
  snap?: number | string | null;
  onSnapChange?: (snap: number | string | null) => void;
  className?: string;
}

export function MapListBottomSheet({
  title,
  headerRight,
  children,
  snap,
  onSnapChange,
  className,
}: MapListBottomSheetProps) {
  const [internalSnap, setInternalSnap] = React.useState<number | string | null>(SNAP_POINTS[0]);

  const activeSnap = snap !== undefined ? snap : internalSnap;
  const setSnap = (s: number | string | null) => {
    setInternalSnap(s);
    onSnapChange?.(s);
  };

  return (
    <Vaul.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={SNAP_POINTS as unknown as (string | number)[]}
      activeSnapPoint={activeSnap}
      setActiveSnapPoint={setSnap}
      shouldScaleBackground={false}
    >
      <Vaul.Portal>
        <Vaul.Content
          aria-label="Список локаций"
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 flex flex-col bg-background border-t border-border shadow-2xl',
            'h-[92dvh] outline-none lg:hidden',
            className,
          )}
        >
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-muted shrink-0" />
          <div className="px-4 py-2 flex items-center justify-between border-b border-border shrink-0">
            <Vaul.Title className="text-sm font-semibold text-foreground">{title}</Vaul.Title>
            {headerRight}
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export const MAP_SHEET_SNAPS = SNAP_POINTS;

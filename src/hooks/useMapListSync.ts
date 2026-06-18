/**
 * useMapListSync — двусторонняя синхронизация выбора между списком и картой.
 *
 * - selectedId хранится в URL как ?focus=<id> (deep-link / share-friendly).
 * - hoveredId локальный, для desktop hover-эффектов.
 * - При маунте читает focus из URL → автоматический deep-link.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const FOCUS_PARAM = 'focus';

export interface UseMapListSyncOptions {
  /** Use URL ?focus param. Default true. Disable for embedded maps. */
  syncToUrl?: boolean;
  /** Optional: validate that id still exists in current dataset; auto-clears if returns false. */
  validate?: (id: string) => boolean;
}

export interface MapListSync {
  selectedId: string | null;
  hoveredId: string | null;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  clear: () => void;
}

export function useMapListSync({ syncToUrl = true, validate }: UseMapListSyncOptions = {}): MapListSync {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFocus = syncToUrl ? searchParams.get(FOCUS_PARAM) : null;

  const [internalSelected, setInternalSelected] = useState<string | null>(urlFocus);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedId = syncToUrl ? urlFocus : internalSelected;

  // Auto-clear if validator says id no longer exists (e.g. filter removed it).
  useEffect(() => {
    if (!selectedId || !validate) return;
    if (!validate(selectedId)) {
      if (syncToUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete(FOCUS_PARAM);
            return next;
          },
          { replace: true },
        );
      } else {
        setInternalSelected(null);
      }
    }
  }, [selectedId, validate, syncToUrl, setSearchParams]);

  const select = useCallback(
    (id: string | null) => {
      if (syncToUrl) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (id) next.set(FOCUS_PARAM, id);
            else next.delete(FOCUS_PARAM);
            return next;
          },
          { replace: true },
        );
      } else {
        setInternalSelected(id);
      }
    },
    [syncToUrl, setSearchParams],
  );

  const clear = useCallback(() => select(null), [select]);

  return {
    selectedId,
    hoveredId,
    select,
    hover: setHoveredId,
    clear,
  };
}

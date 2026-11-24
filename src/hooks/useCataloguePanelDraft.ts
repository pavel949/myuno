import { useState } from 'react';

/** One draft per opening; applying owns only the panel's URL keys, never the search text or route context. */
export function useCataloguePanelDraft(keys: readonly string[], current: URLSearchParams, commit: (next: URLSearchParams) => void) {
  const [editing, setEditing] = useState<{ initial: URLSearchParams; draft: URLSearchParams } | null>(null);
  return {
    values: editing?.draft ?? current,
    setValues: (update: (next: URLSearchParams) => URLSearchParams) =>
      setEditing(previous => ({ initial: previous?.initial ?? current, draft: update(new URLSearchParams(previous?.draft ?? current)) })),
    openChange: (open: boolean) => setEditing(open ? { initial: current, draft: new URLSearchParams(current) } : null),
    apply: (latest: URLSearchParams = current) => {
      if (!editing) return;
      const next = new URLSearchParams(latest);
      for (const key of keys) {
        if (editing.draft.get(key) === editing.initial.get(key)) continue;
        const value = editing.draft.get(key);
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      setEditing(null);
      if (next.toString() !== latest.toString()) commit(next);
    },
  };
}

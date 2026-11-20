import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Keep typing urgent while a router transition commits the canonical query. */
export function useUrlSearchDraft(query: string, write: (query: string) => void) {
  const { pathname, key } = useLocation();
  const action = useNavigationType();
  const [draft, setDraft] = useState<{ value: string; pathname: string; key: string } | null>(null);
  // PUSH/POP may restore an older bookmark. A REPLACE may simply acknowledge
  // an earlier keystroke: it must not overwrite text typed in the meantime.
  const followsDraft = draft?.pathname === pathname && (draft.key === key || action === 'REPLACE');
  useEffect(() => {
    if (draft && (!followsDraft || draft.value === query)) {
      setDraft(current => current === draft ? null : current);
    }
  }, [draft, followsDraft, query]);

  const update = (value: string) => {
    setDraft({ value, pathname, key });
    write(value);
  };
  return [followsDraft ? draft.value : query, update] as const;
}

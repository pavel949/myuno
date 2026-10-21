/**
 * CommandPalette — Wave 4 global ⌘K search.
 *
 * Sources (read-only, no new DB):
 *   - APP_REGISTRY (59 micro-apps)
 *   - Active role personas (boost matches via personaTags)
 *   - localStorage `myuno.cmdk.recent` for "Recent" group (last 5)
 *
 * Gated by feature_flag:command_palette. Trigger via:
 *   - ⌘K / Ctrl+K / "/" (global hotkey, mounted in CommandPaletteMount)
 *   - Hero search button on IndexV2
 *
 * Mobile renders as bottom Sheet per DS 2.1 (no Dialog on coarse pointers).
 * Uses semantic tokens only — no hardcoded colours.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Clock, User, Compass } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { APP_REGISTRY, type AppEntry } from '@/lib/appRegistry';

const RECENT_KEY = 'myuno.cmdk.recent';
const RECENT_MAX = 5;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchRole?: () => void;
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function pushRecent(appId: string) {
  try {
    const prev = loadRecent().filter((id) => id !== appId);
    const next = [appId, ...prev].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / SSR */
  }
}

function useIsCoarse(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(pointer: coarse)');
    setCoarse(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return coarse;
}

const ALL_APPS: AppEntry[] = Object.values(APP_REGISTRY).filter((a) => a.status !== 'soon');

interface PaletteBodyProps {
  onClose: () => void;
  onSwitchRole?: () => void;
}

const PaletteBody: React.FC<PaletteBodyProps> = ({ onClose, onSwitchRole }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { effectivePersonas } = useUserPersonas();
  const isRu = language === 'ru';

  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent());

  const getLabel = useCallback(
    (a: AppEntry) => (isRu ? a.labelRu : a.labelEn) || a.id,
    [isRu],
  );

  const activeTags = new Set<string>(effectivePersonas);

  const personalised = useMemo(() => {
    return [...ALL_APPS].sort((a, b) => {
      const aBoost = a.personaTags.some((t) => activeTags.has(t)) ? 1 : 0;
      const bBoost = b.personaTags.some((t) => activeTags.has(t)) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      return getLabel(a).localeCompare(getLabel(b), isRu ? 'ru' : 'en');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePersonas, isRu]);

  const recent = useMemo(
    () => recentIds.map((id) => APP_REGISTRY[id]).filter(Boolean),
    [recentIds],
  );

  const go = useCallback(
    (app: AppEntry) => {
      pushRecent(app.id);
      setRecentIds(loadRecent());
      onClose();
      // navigate after the close transition starts → no layout jank
      window.setTimeout(() => navigate(app.route), 0);
    },
    [navigate, onClose],
  );

  return (
    <Command
      label={isRu ? 'Поиск по приложениям' : 'Search apps'}
      className="bg-card border-0"
      shouldFilter
    >
      <CommandInput
        placeholder={isRu ? 'Поиск приложений, ролей, услуг…' : 'Search apps, roles, services…'}
        autoFocus
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {isRu ? 'Ничего не найдено' : 'No results'}
        </CommandEmpty>

        {recent.length > 0 && (
          <>
            <CommandGroup heading={isRu ? 'Недавнее' : 'Recent'}>
              {recent.map((app) => (
                <CommandItem
                  key={`recent-${app.id}`}
                  value={`recent ${getLabel(app)} ${app.id}`}
                  onSelect={() => go(app)}
                  className="gap-3"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{getLabel(app)}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading={isRu ? 'Приложения' : 'Apps'}>
          {personalised.map((app) => (
            <CommandItem
              key={app.id}
              value={`${getLabel(app)} ${app.id} ${app.groupId} ${app.clusterIds.join(' ')}`}
              onSelect={() => go(app)}
              className="gap-3"
            >
              <Compass className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{getLabel(app)}</span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {app.groupId}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        {onSwitchRole && (
          <>
            <CommandSeparator />
            <CommandGroup heading={isRu ? 'Действия' : 'Actions'}>
              <CommandItem
                value={isRu ? 'действия сменить роль персона' : 'actions switch role persona'}
                onSelect={() => {
                  onClose();
                  window.setTimeout(() => onSwitchRole(), 0);
                }}
                className="gap-3"
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="flex-1">{isRu ? 'Сменить роль' : 'Switch role'}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
      <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Search className="w-3 h-3" />
          {isRu ? 'myUNO поиск' : 'myUNO search'}
        </span>
        <kbd className="font-mono">⌘K · Ctrl+K · /</kbd>
      </div>
    </Command>
  );
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onSwitchRole,
}) => {
  const coarse = useIsCoarse();

  if (coarse) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="p-0 max-h-[85vh] rounded-none border-t border-border bg-card"
        >
          <PaletteBody onClose={() => onOpenChange(false)} onSwitchRole={onSwitchRole} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden rounded-none border border-border bg-card sm:max-w-[640px]">
        <PaletteBody onClose={() => onOpenChange(false)} onSwitchRole={onSwitchRole} />
      </DialogContent>
    </Dialog>
  );
};

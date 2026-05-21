import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { PERSONA_OPTIONS_PRIMARY, PERSONA_OPTIONS_LIFESTYLE } from '@/hooks/useUserPersonas';
import { ROLE_META, personaColor } from '@/lib/roleBlend';

interface RoleSheetProps {
  open: boolean;
  personas: UserPersona[];
  onClose: () => void;
  onToggle: (p: UserPersona) => void;
  onReorder: (reordered: UserPersona[]) => void;
}

export function RoleSheet({ open, personas, onClose, onToggle, onReorder }: RoleSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...personas];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  };

  const moveDown = (idx: number) => {
    if (idx === personas.length - 1) return;
    const next = [...personas];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  };

  const allKnownRoles: UserPersona[] = [...PERSONA_OPTIONS_PRIMARY, ...PERSONA_OPTIONS_LIFESTYLE];
  const availableRoles = allKnownRoles.filter(
    p => !personas.includes(p) && ROLE_META[p] !== undefined
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-none p-0 overflow-auto">
        <div className="p-5 pb-8">
          {/* Drag handle */}
          <div className="w-9 h-1 rounded-full bg-border/60 mx-auto mb-5" />

          <h2 className="font-display text-h3 font-normal text-foreground tracking-[-0.02em] mb-1">
            {isRu ? 'Ваши роли' : 'Your roles'}
          </h2>
          <p className="text-body-sm text-muted-foreground leading-relaxed mb-5">
            {isRu
              ? 'На Пхукете люди носят много шляп. Выберите актуальные — myUNO объединит их. Порядок = приоритет.'
              : "Phuket is a place where people wear many hats. Pick what's true today — myUNO blends them. Order = priority."}
          </p>

          {/* Active roles */}
          {personas.length > 0 && (
            <>
              <div className="text-label text-muted-foreground/70 mb-2">
                {isRu ? 'Активные · порядок = приоритет' : 'Active · order = priority'}
              </div>
              <div className="flex flex-col gap-1.5 mb-5">
                {personas.map((p, i) => {
                  const meta = ROLE_META[p];
                  if (!meta) return null;
                  const isPrimary = i === 0;
                  return (
                    <div
                      key={p}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-none border',
                        !isPrimary && 'border-border',
                      )}
                      style={isPrimary
                        ? { borderColor: personaColor(p, 0.35), background: personaColor(p, 0.06) }
                        : undefined}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-display text-label font-semibold text-background flex-shrink-0"
                        style={{ background: personaColor(p) }}
                      >
                        {meta.glyph}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body-sm font-medium text-foreground flex items-center gap-1.5">
                          {isRu ? meta.labelRu : meta.short}
                          {isPrimary && (
                            <span
                              className="text-[10px] font-semibold tracking-[0.1em] uppercase"
                              style={{ color: personaColor(p) }}
                            >
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-caption text-muted-foreground leading-snug">
                          {isRu ? meta.descRu : meta.descEn}
                        </div>
                      </div>
                      {/* WCAG-compliant reorder controls — 44×44 hit target each */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          aria-label={isRu ? 'Выше' : 'Move up'}
                          className="h-11 w-11 inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground/70 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          onClick={() => moveDown(i)}
                          disabled={i === personas.length - 1}
                          aria-label={isRu ? 'Ниже' : 'Move down'}
                          className="h-11 w-11 inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground/70 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                      <button
                        onClick={() => onToggle(p)}
                        className="h-11 px-3 inline-flex items-center text-caption font-medium rounded-none border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                      >
                        {isRu ? 'Убрать' : 'Remove'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add roles */}
          {availableRoles.length > 0 && (
            <>
              <div className="text-label text-muted-foreground/70 mb-2">
                {isRu ? 'Добавить роль' : 'Add a role'}
              </div>
              <div className="flex flex-col gap-1.5">
                {availableRoles.map(p => {
                  const meta = ROLE_META[p];
                  if (!meta) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => onToggle(p)}
                      className="flex items-center gap-3 p-3 rounded-none border border-border text-left hover:border-border/80 transition-colors min-h-[44px]"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-display text-label font-semibold text-background flex-shrink-0"
                        style={{ background: personaColor(p) }}
                      >
                        {meta.glyph}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-body-sm font-medium text-foreground">{isRu ? meta.labelRu : meta.short}</div>
                        <div className="text-caption text-muted-foreground leading-snug">
                          {isRu ? meta.descRu : meta.descEn}
                        </div>
                      </div>
                      <div className="ml-auto text-body text-muted-foreground/60 leading-none">+</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full h-12 rounded-none bg-foreground text-background text-body font-semibold"
          >
            {isRu ? 'Готово' : 'Done'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { PERSONA_OPTIONS_PRIMARY, PERSONA_OPTIONS_LIFESTYLE } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';

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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-[28px] p-0 overflow-auto">
        <div className="p-5 pb-8">
          {/* Drag handle */}
          <div className="w-9 h-1 rounded-full bg-border/60 mx-auto mb-5" />

          <h2 className="font-display text-[22px] font-bold text-foreground tracking-[-0.02em] mb-1">
            {isRu ? 'Ваши роли' : 'Your roles'}
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
            {isRu
              ? 'На Пхукете люди носят много шляп. Выберите актуальные — myUNO объединит их. Порядок = приоритет.'
              : "Phuket is a place where people wear many hats. Pick what's true today — myUNO blends them. Order = priority."}
          </p>

          {/* Active roles */}
          {personas.length > 0 && (
            <>
              <div className="text-[10.5px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold mb-2">
                {isRu ? 'Активные · порядок = приоритет' : 'Active · order = priority'}
              </div>
              <div className="flex flex-col gap-1.5 mb-5">
                {personas.map((p, i) => {
                  const meta = ROLE_META[p];
                  if (!meta) return null;
                  return (
                    <div
                      key={p}
                      className="flex items-center gap-2.5 p-3 rounded-[12px] border"
                      style={i === 0
                        ? { borderColor: `${meta.color}55`, background: `${meta.color}0d` }
                        : { borderColor: 'var(--border)' }}
                    >
                      <div
                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[11px] font-bold text-background flex-shrink-0"
                        style={{ background: meta.color }}
                      >
                        {meta.glyph}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                          {isRu ? meta.labelRu : meta.short}
                          {i === 0 && (
                            <span className="text-[9px] font-bold tracking-[0.08em] uppercase" style={{ color: meta.color }}>
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-snug">
                          {isRu ? meta.descRu : meta.descEn}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          className="text-[8px] px-1.5 py-0.5 rounded-none border border-border text-muted-foreground disabled:opacity-30"
                        >▲</button>
                        <button
                          onClick={() => moveDown(i)}
                          disabled={i === personas.length - 1}
                          className="text-[8px] px-1.5 py-0.5 rounded-none border border-border text-muted-foreground disabled:opacity-30"
                        >▼</button>
                      </div>
                      <button
                        onClick={() => onToggle(p)}
                        className="text-[10px] font-medium px-2 py-1 rounded-none border border-border text-muted-foreground"
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
              <div className="text-[10.5px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold mb-2">
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
                      className="flex items-center gap-3 p-3 rounded-[12px] border border-border text-left hover:border-border/80 transition-colors"
                    >
                      <div
                        className="w-[22px] h-[22px] rounded-full flex items-center justify-center font-display text-[10px] font-bold text-background flex-shrink-0"
                        style={{ background: meta.color }}
                      >
                        {meta.glyph}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-foreground">{isRu ? meta.labelRu : meta.short}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug">
                          {isRu ? meta.descRu : meta.descEn}
                        </div>
                      </div>
                      <div className="ml-auto text-[14px] text-muted-foreground/60 leading-none">+</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full py-3.5 rounded-[14px] bg-foreground text-background text-[14px] font-semibold"
          >
            {isRu ? 'Готово' : 'Done'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

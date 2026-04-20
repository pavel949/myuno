/**
 * ContextualFAB — universal mobile floating action button.
 *
 * Replaces the inline FAB inside MCMobileNav.
 * Reads FAB_ACTIONS[role] from the SSOT navigation model.
 *
 * Visibility:
 *  - Mobile only (<768px) — hidden on md+.
 *  - Returns null when role has no FAB actions (consumer / non-owner workspace).
 *  - Sits above the bottom-bar; safe-area aware via inline style.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { FAB_ACTIONS, hasFab, type NavRoleKey } from '@/lib/nav/navigationModel';

interface ContextualFABProps {
  role: NavRoleKey;
}

export function ContextualFAB({ role }: ContextualFABProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const isRu = language === 'ru';

  if (!hasFab(role)) return null;
  const actions = FAB_ACTIONS[role]!;

  const handleAction = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action.path);
                  }}
                  className="flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                >
                  <span className="text-sm font-semibold text-primary-foreground bg-foreground/60 backdrop-blur rounded-full px-3 py-1.5 [box-shadow:var(--shadow-elevation-3)]">
                    {isRu ? action.labelRu : action.labelEn}
                  </span>
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center [box-shadow:var(--shadow-elevation-3)]',
                      action.tone,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label={isRu ? 'Быстрые действия' : 'Quick actions'}
        className={cn(
          'fixed z-[70] md:hidden bottom-[76px] left-1/2 -translate-x-1/2 w-14 h-14 rounded-full',
          '[box-shadow:var(--shadow-elevation-4)] flex items-center justify-center transition-all duration-200',
          open ? 'bg-foreground text-background rotate-45' : 'bg-primary text-primary-foreground',
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </>
  );
}

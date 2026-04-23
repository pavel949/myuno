/**
 * Sticky banner when an admin enabled platform "view as" (audit UX only).
 */
import { Eye, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformViewAs } from '@/contexts/PlatformViewAsContext';

export function PlatformViewAsBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { isActive, targetEmail, targetUserId, exit } = usePlatformViewAs();

  if (!isActive || !targetUserId) return null;

  const label = targetEmail || targetUserId.slice(0, 8);

  return (
    <div className="sticky top-0 z-50 bg-primary/95 text-muted-foreground border-b border-primary/40/40">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 text-xs sm:text-sm">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1">
          {isRu ? (
            <>
              Режим просмотра: вы смотрите как пользователь <strong>{label}</strong>
              {' — '}
              <span className="opacity-90">JWT не меняется, RLS как у вашего аккаунта.</span>
            </>
          ) : (
            <>
              View-as: acting for user <strong>{label}</strong>
              {' — '}
              <span className="opacity-90">JWT unchanged; RLS still applies to your admin session.</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => void exit()}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-primary/25 hover:bg-primary/40 transition-colors font-medium shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          {isRu ? 'Выйти' : 'Exit'}
        </button>
      </div>
    </div>
  );
}

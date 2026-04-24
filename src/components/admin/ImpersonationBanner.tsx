/**
 * ImpersonationBanner — sticky top banner shown while admin is acting as a developer.
 * Click "Exit" to drop back into the admin's own context.
 */
import { Eye, X } from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export function ImpersonationBanner() {
  const { developerId, developerName, exit } = useImpersonation();
  if (!developerId) return null;
  return (
    <div className="sticky top-0 z-50 bg-accent/95 text-accent border-b border-accent/40">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 text-xs sm:text-sm">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1">
          Режим администратора: вы действуете как <strong>{developerName ?? developerId.slice(0, 8)}</strong>
        </span>
        <button
          onClick={exit}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-accent/15 hover:bg-accent/25 transition-colors font-medium shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          Выйти
        </button>
      </div>
    </div>
  );
}

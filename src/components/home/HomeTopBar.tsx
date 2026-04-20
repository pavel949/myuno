import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';

interface HomeTopBarProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

export function HomeTopBar({ personas, onRoleSheetOpen }: HomeTopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const displayPersonas = personas.slice(0, 3);

  return (
    <div className="flex items-center justify-between pt-3 pb-4">
      {/* Logo */}
      <div className="flex items-baseline gap-0">
        <span className="font-display text-[22px] font-normal text-muted-foreground tracking-[-0.02em]">my</span>
        <span className="font-display text-[22px] font-bold text-foreground tracking-[0.02em]">UNO</span>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2.5">
        {/* Role stack pill */}
        {displayPersonas.length > 0 && (
          <button
            onClick={onRoleSheetOpen}
            className="flex items-center gap-0 h-9 pl-1 pr-2.5 rounded-full border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex">
              {displayPersonas.map((p, i) => {
                const meta = ROLE_META[p];
                if (!meta) return null;
                return (
                  <div
                    key={p}
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-display text-[11px] font-bold text-[#08101E] border-2 border-background"
                    style={{ background: meta.color, marginLeft: i === 0 ? 0 : -9, zIndex: 10 - i }}
                  >
                    {meta.glyph}
                  </div>
                );
              })}
            </div>
            {personas.length > 3 && (
              <span className="font-mono text-[10px] text-muted-foreground ml-1.5">+{personas.length - 3}</span>
            )}
            <svg className="ml-2 opacity-50" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Bell */}
        <button
          onClick={() => navigate('/account?tab=notifications')}
          className="relative w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-[17px] h-[17px]" />
          <span className="absolute top-[7px] right-[9px] w-[6px] h-[6px] rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/account')}
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center font-display text-[12px] font-semibold text-foreground"
          style={{ background: 'linear-gradient(135deg, #26314A 0%, #0F1C2E 100%)' }}
        >
          {initials}
        </button>
      </div>
    </div>
  );
}

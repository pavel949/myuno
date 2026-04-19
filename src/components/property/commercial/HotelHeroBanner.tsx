/**
 * HotelHeroBanner — 4 use-case entry points on the Hotels landing.
 *  - Buy a hotel (investor)
 *  - Sell a hotel (owner → wizard)
 *  - Lease the building (lease intent)
 *  - Hand over to management (HMA lead form)
 */
import { ShoppingCart, Tag, KeyRound, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface Props {
  onOpenHmaForm: () => void;
}

export function HotelHeroBanner({ onOpenHmaForm }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const cards = [
    {
      icon: ShoppingCart,
      title: isRu ? 'Купить отель' : 'Buy a hotel',
      desc: isRu ? 'Готовый бизнес с проверенным P&L' : 'Turnkey assets with verified P&L',
      to: `${APP_ROUTES.HOTELS}?mode=buy`,
      tone: 'amber' as const,
    },
    {
      icon: Tag,
      title: isRu ? 'Продать отель' : 'Sell a hotel',
      desc: isRu ? 'Закрытый пул инвесторов и операторов' : 'Private buyer & operator pool',
      to: `${APP_ROUTES.MC_PROPERTY_NEW}?asset=commercial&type=hotel_building`,
      tone: 'blue' as const,
    },
    {
      icon: KeyRound,
      title: isRu ? 'Арендовать здание' : 'Lease the building',
      desc: isRu ? 'Долгосрочная аренда под отель' : 'Long-term hotel building lease',
      to: `${APP_ROUTES.HOTELS}?mode=lease`,
      tone: 'emerald' as const,
    },
    {
      icon: Handshake,
      title: isRu ? 'Передать в управление' : 'Hand over to operator',
      desc: isRu ? 'Найти бренд / управляющую компанию' : 'Find a brand / management company',
      onClick: onOpenHmaForm,
      tone: 'violet' as const,
    },
  ];

  const toneClasses = {
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:border-amber-500/60',
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400 hover:border-blue-500/60',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/60',
    violet: 'border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-400 hover:border-violet-500/60',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {cards.map((c) => {
        const Icon = c.icon;
        const inner = (
          <div
            className={cn(
              'h-full flex flex-col gap-2 p-3.5 rounded-2xl border-2 transition-all bg-card hover:shadow-md',
              toneClasses[c.tone],
            )}
          >
            <div
              className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center',
                c.tone === 'amber' && 'bg-amber-500/15',
                c.tone === 'blue' && 'bg-blue-500/15',
                c.tone === 'emerald' && 'bg-emerald-500/15',
                c.tone === 'violet' && 'bg-violet-500/15',
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-snug text-foreground">{c.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{c.desc}</div>
            </div>
          </div>
        );
        return c.to ? (
          <Link key={c.title} to={c.to} className="block">
            {inner}
          </Link>
        ) : (
          <button key={c.title} type="button" onClick={c.onClick} className="block text-left w-full">
            {inner}
          </button>
        );
      })}
    </div>
  );
}

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
    amber: 'border-accent/40 bg-accent/5 text-accent dark:text-accent hover:border-accent/40',
    blue: 'border-primary/40 bg-primary/5 text-primary dark:text-primary hover:border-primary/40',
    emerald: 'border-success/40 bg-success/5 text-success dark:text-success hover:border-success/40',
    violet: 'border-primary/40 bg-primary/5 text-primary dark:text-primary hover:border-primary/40',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {cards.map((c) => {
        const Icon = c.icon;
        const inner = (
          <div
            className={cn(
              'h-full flex flex-col gap-2 p-3.5 rounded-none border-2 transition-all bg-card hover:shadow-md',
              toneClasses[c.tone],
            )}
          >
            <div
              className={cn(
                'h-9 w-9 rounded-none flex items-center justify-center',
                c.tone === 'amber' && 'bg-accent/15',
                c.tone === 'blue' && 'bg-primary/15',
                c.tone === 'emerald' && 'bg-success/15',
                c.tone === 'violet' && 'bg-primary/15',
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

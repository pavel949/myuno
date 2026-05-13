import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

/**
 * Canonical "myUNO" lockup — same treatment as the main app chrome (see TopBar).
 * SSOT for logo typography and colors.
 *
 * Tone variants:
 *  - `default` — prefix `my` in primary, `UNO` in foreground; one type scale + font-display.
 *  - `onNavy`  — orange-400 `my` + cream `UNO` on the navy brand band (home header).
 */
interface BrandWordmarkProps {
  className?: string;
  /** `link` — full header (default); `static` — home column without navigation wrapper */
  as?: 'link' | 'static';
  /** Background tone the wordmark sits on. Defaults to `default` (cream). */
  tone?: 'default' | 'onNavy';
}

/** One scale + display face for the full lockup (prefix colour only). */
const LOCKUP_TYPE =
  'font-display text-base lg:text-xl font-bold tracking-tight leading-none';

export function BrandWordmark({ className, as = 'link', tone = 'default' }: BrandWordmarkProps) {
  const isOnNavy = tone === 'onNavy';
  const inner = (
    <>
      <span
        className={cn(
          LOCKUP_TYPE,
          isOnNavy ? 'text-[hsl(var(--brand-orange-400))]' : 'text-primary',
        )}
      >
        my
      </span>
      <span
        className={cn(
          LOCKUP_TYPE,
          isOnNavy ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        UNO
      </span>
    </>
  );

  const rowClass =
    'flex items-baseline gap-0.5 flex-shrink-0 whitespace-nowrap tracking-tight transition-[letter-spacing] duration-200';

  if (as === 'static') {
    return (
      <div className={cn(rowClass, className)}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={APP_ROUTES.HOME}
      className={cn(rowClass, 'group mr-1 hover:tracking-wide', className)}
    >
      {inner}
    </Link>
  );
}

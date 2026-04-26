import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

/**
 * Canonical "myUNO" lockup — same treatment as the main app chrome (see TopBar).
 * SSOT for logo typography and colors.
 *
 * Tone variants:
 *  - `default` — ink "my" prefix on cream, foreground "UNO" (page chrome).
 *  - `onNavy`  — orange-400 "my" + cream "UNO" for placement on the navy
 *                brand band (home header). Uses the canonical
 *                `--brand-orange-400` so the lockup stays in the palette.
 */
interface BrandWordmarkProps {
  className?: string;
  /** `link` — full header (default); `static` — home column without navigation wrapper */
  as?: 'link' | 'static';
  /** Background tone the wordmark sits on. Defaults to `default` (cream). */
  tone?: 'default' | 'onNavy';
}

export function BrandWordmark({ className, as = 'link', tone = 'default' }: BrandWordmarkProps) {
  const isOnNavy = tone === 'onNavy';
  const inner = (
    <>
      <span
        className={cn(
          'text-sm lg:text-base font-bold transition-all duration-200 group-hover:tracking-wider',
          isOnNavy
            ? 'text-[hsl(var(--brand-orange-400))]'
            : 'text-primary',
        )}
      >
        my
      </span>
      <span
        className={cn(
          'text-base lg:text-xl font-bold font-display tracking-tight',
          isOnNavy ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        UNO
      </span>
    </>
  );

  if (as === 'static') {
    return (
      <div
        className={cn(
          'group flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap',
          className,
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={APP_ROUTES.HOME}
      className={cn('flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap group mr-1', className)}
    >
      {inner}
    </Link>
  );
}

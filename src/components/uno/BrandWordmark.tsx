import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

/**
 * Canonical "myUNO" lockup — same treatment as the main app chrome (see TopBar).
 * SSOT for logo typography and colors: primary "my" + display "UNO".
 */
interface BrandWordmarkProps {
  className?: string;
  /** `link` — full header (default); `static` — home column without navigation wrapper */
  as?: 'link' | 'static';
}

export function BrandWordmark({ className, as = 'link' }: BrandWordmarkProps) {
  const inner = (
    <>
      <span className="text-sm lg:text-base text-primary font-bold transition-all duration-200 group-hover:tracking-wider">
        my
      </span>
      <span className="text-base lg:text-xl font-bold text-foreground font-display tracking-tight">UNO</span>
    </>
  );

  if (as === 'static') {
    return (
      <div className={cn('group flex items-center gap-0.5 min-w-0', className)}>{inner}</div>
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

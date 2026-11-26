import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface BrandWordmarkProps {
  className?: string;
  as?: 'link' | 'static';
  tone?: 'default' | 'onNavy';
}

/** The shared arch and keystone lockup from the Design Bible. */
export function BrandWordmark({ className, as = 'link', tone = 'default' }: BrandWordmarkProps) {
  const wordmark = (
    <>
      <svg viewBox="0 0 48 56" className="myuno-brand-mark" aria-hidden="true" focusable="false">
        <path fill="currentColor" fillRule="evenodd" d="M4 56V28a20 20 0 0 1 40 0v28ZM12 56V34a12 12 0 0 1 24 0v22Z" />
        <rect className="myuno-brand-keystone" x="22" y="2" width="4" height="9" rx="2" />
      </svg>
      <span className="font-normal">my<span className="font-bold">UNO</span></span>
    </>
  );
  const classes = cn('myuno-brand-lockup', tone === 'onNavy' && 'myuno-brand-on-navy', className);

  if (as === 'static') return <div className={classes}>{wordmark}</div>;

  return <Link to={APP_ROUTES.HOME} aria-label="myUNO" className={cn('ds-focus', classes)}>{wordmark}</Link>;
}

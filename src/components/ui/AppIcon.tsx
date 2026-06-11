/**
 * Canonical app icon renderer.
 *
 * Looks up the id in `APP_ICONS` (src/lib/icons/appIconRegistry.ts) and
 * renders the Lucide component with project-wide stroke width 1.75 and
 * `currentColor`. Replaces ad-hoc emoji rendering in app cards/lists.
 *
 * Per design bible §730: no emoji icons in UI; Lucide only.
 */
import { forwardRef } from 'react';
import { getAppIcon } from '@/lib/icons/appIconRegistry';
import { cn } from '@/lib/utils';

interface AppIconProps {
  /** App or vertical id, e.g. "property", "transfer", "vip-concierge" */
  id: string | undefined | null;
  /** Pixel size (default 20) */
  size?: number;
  className?: string;
  'aria-label'?: string;
}

export const AppIcon = forwardRef<SVGSVGElement, AppIconProps>(
  ({ id, size = 20, className, ...rest }, ref) => {
    const Icon = getAppIcon(id);
    return (
      <Icon
        ref={ref}
        width={size}
        height={size}
        strokeWidth={1.75}
        className={cn('shrink-0', className)}
        aria-hidden={rest['aria-label'] ? undefined : true}
        {...rest}
      />
    );
  },
);

AppIcon.displayName = 'AppIcon';

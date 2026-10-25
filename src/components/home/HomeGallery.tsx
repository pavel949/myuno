import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/ds/SectionHeader';
import { HorizontalRail } from './HorizontalRail';

/** One section/scroll contract; individual domains own card facts and data states. */
export function HomeGallery({ id, title, description, href, linkLabel, children, state, className = '' }: {
  id: string; title: string; description?: string; href: string; linkLabel: string;
  children?: ReactNode; state?: ReactNode; className?: string;
}) {
  return <section className={`home-gallery home-container ${className}`} aria-labelledby={id}>
    <SectionHeader title={title} subtitle={description} headingId={id} action={{ label: linkLabel, to: href }} size="lg" density="public" className="home-gallery-heading" />
    {state ?? <HorizontalRail label={title}>{children}</HorizontalRail>}
  </section>;
}

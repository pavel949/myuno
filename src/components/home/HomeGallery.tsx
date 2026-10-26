import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { HorizontalRail } from './HorizontalRail';

/** One section/scroll contract; individual domains own card facts and data states. */
export function HomeGallery({ id, title, description, href, linkLabel, children, state, className = '' }: {
  id: string; title: string; description?: string; href: string; linkLabel: string;
  children?: ReactNode; state?: ReactNode; className?: string;
}) {
  return <section className={`home-gallery home-container ${className}`} aria-labelledby={id}>
    <div className="home-section-heading"><div><h2 id={id}>{title}</h2>{description && <p className="home-section-lead">{description}</p>}</div><Link className="home-text-link" to={href}>{linkLabel}<ArrowRight size={18} aria-hidden="true" /></Link></div>
    {state ?? <HorizontalRail label={title}>{children}</HorizontalRail>}
  </section>;
}

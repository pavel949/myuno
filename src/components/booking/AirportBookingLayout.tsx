import type { ReactNode } from 'react';
import coast from '../../assets/hero-phuket-coast-editorial.webp';
import transfer from '../../assets/solutions/transfer.webp';

interface AirportBookingLayoutProps {
  variant: 'transfer' | 'fast-track';
  title: string;
  airport: string;
  back: ReactNode;
  progress: ReactNode;
  summary: ReactNode;
  children: ReactNode;
}

export function AirportBookingLayout({ variant, title, airport, back, progress, summary, children }: AirportBookingLayoutProps) {
  return (
    <div className="airport-booking" data-airport-booking={variant}>
      <header className="airport-booking__hero">
        <img className="airport-booking__image" src={variant === 'transfer' ? transfer : coast} alt="" fetchPriority="high" />
        <div className="airport-booking__hero-content">
          <div className="airport-booking__back">{back}</div>
          <div>
            <p>{airport}</p>
            <h1>{title}</h1>
          </div>
        </div>
      </header>
      <div className="airport-booking__frame">
        <div className="airport-booking__workspace">
          <div className="airport-booking__progress">{progress}</div>
          <div className="airport-booking__fields">{children}</div>
        </div>
        <div className="airport-booking__summary" data-chat-occlusion-target>{summary}</div>
      </div>
    </div>
  );
}

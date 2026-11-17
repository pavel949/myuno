import coast from '@/assets/hero-phuket-coast-editorial.webp';
import property from '@/assets/hero-phuket-desktop.webp';
import '@/styles/landing-editorial.css';

export function LandingEditorialPhoto({ subject = 'destination' }: { subject?: 'destination' | 'property' }) {
  return (
    <img
      className="landing-editorial-photo"
      src={subject === 'property' ? property : coast}
      alt=""
      width={subject === 'property' ? 1920 : 1672}
      height={subject === 'property' ? 1080 : 941}
      decoding="async"
    />
  );
}

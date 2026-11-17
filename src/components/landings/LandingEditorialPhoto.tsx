import '@/styles/landing-editorial.css';

export const landingCoastPhoto = '/landing/hero-phuket-coast-editorial.webp';
const landingPropertyPhoto = '/landing/hero-phuket-desktop.webp';

export function LandingEditorialPhoto({ subject = 'destination' }: { subject?: 'destination' | 'property' }) {
  return (
    <img
      className="landing-editorial-photo"
      src={subject === 'property' ? landingPropertyPhoto : landingCoastPhoto}
      alt=""
      width={subject === 'property' ? 1920 : 1672}
      height={subject === 'property' ? 1080 : 941}
      decoding="async"
    />
  );
}

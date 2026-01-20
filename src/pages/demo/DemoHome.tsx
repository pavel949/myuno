import { useEffect } from 'react';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { GuidedTour } from '@/components/demo/GuidedTour';
import { useDemoMode } from '@/hooks/useDemoMode';
import Index from '@/pages/Index';

export default function DemoHome() {
  const { trackDemoAction } = useDemoMode();

  useEffect(() => {
    trackDemoAction('demo_home_viewed');
  }, []);

  return (
    <>
      <DemoBanner />
      <div className="pt-10">
        <Index />
      </div>
      <GuidedTour autoStart={false} />
    </>
  );
}

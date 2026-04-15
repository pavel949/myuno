import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InstallData {
  platform: 'ios' | 'android' | 'desktop';
  source: string;
}

export function usePWATracking() {
  const { user } = useAuth();

  const trackInstall = async ({ platform, source }: InstallData) => {
    const userAgent = navigator.userAgent;
    const browser = detectBrowser(userAgent);
    
    const deviceInfo = {
      userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    };

    try {
      await supabase.from('pwa_installs').insert({
        user_id: user?.id || null,
        platform,
        browser,
        device_info: deviceInfo,
        source,
      });
    } catch {
      // PWA tracking is non-critical
    }
  };

  return { trackInstall };
}

function detectBrowser(ua: string): string {
  const lowerUA = ua.toLowerCase();
  
  if (lowerUA.includes('crios')) return 'chrome_ios';
  if (lowerUA.includes('fxios')) return 'firefox_ios';
  if (lowerUA.includes('safari') && !lowerUA.includes('chrome')) return 'safari';
  if (lowerUA.includes('edg')) return 'edge';
  if (lowerUA.includes('firefox')) return 'firefox';
  if (lowerUA.includes('chrome')) return 'chrome';
  if (lowerUA.includes('samsung')) return 'samsung';
  
  return 'other';
}

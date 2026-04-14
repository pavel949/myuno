import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallContextType {
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  canInstall: boolean;
  install: () => Promise<boolean>;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

// Global variable to persist the prompt across component remounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    // Check if already installed - must be in standalone mode AND not in an iframe
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    // Avoid false positive in iframes (e.g. embedded previews)
    const isInIframe = window.self !== window.top;
    setIsInstalled(isStandalone && !isInIframe);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const mobile = ios || android || /mobile/.test(userAgent);
    
    setIsIOS(ios);
    setIsAndroid(android);
    setIsMobile(mobile);

    // Listen for install prompt - save globally
    const handleBeforeInstall = (e: Event) => {
      logger.debug('[PWA] beforeinstallprompt event received');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    const handleAppInstalled = () => {
      logger.debug('[PWA] App installed successfully');
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    
    if (!prompt) {
      logger.debug('[PWA] No install prompt available');
      return false;
    }

    try {
      logger.debug('[PWA] Triggering install prompt');
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      
      logger.debug('[PWA] User choice:', outcome);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      logger.debug('[PWA] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const value = useMemo(() => ({
    isInstalled, isIOS, isAndroid, isMobile, canInstall, install,
  }), [isInstalled, isIOS, isAndroid, isMobile, canInstall, install]);

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstallContext() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstallContext must be used within PWAInstallProvider');
  }
  return context;
}

// Legacy hook for backward compatibility
export function usePWAInstall() {
  return usePWAInstallContext();
}

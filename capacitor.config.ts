import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.myuno.pwa',
  appName: 'myUNO',
  webDir: 'dist',
  server: {
    // Production URL — the native app loads the PWA from here
    url: 'https://myuno.app',
    cleartext: false,
  },
  android: {
    // Allow opening myuno.app links directly in the app
    allowNavigation: ['myuno.app', '*.myuno.app'],
  },
  ios: {
    // Scheme used for deep links
    scheme: 'myuno',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#08101E',
      showSpinner: false,
    },
  },
};

export default config;

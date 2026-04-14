import { useState } from 'react';
import { Link2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { toast } from 'sonner';

const texts = {
  ru: {
    sectionTitle: 'Подключённые аккаунты',
    sectionDesc: 'Быстрый вход через социальные сети',
    connect: 'Подключить',
    disconnect: 'Отключить',
    connected: 'Подключён',
    connectError: 'Ошибка подключения',
    google: 'Google',
    apple: 'Apple',
  },
  en: {
    sectionTitle: 'Connected Accounts',
    sectionDesc: 'Quick sign-in via social networks',
    connect: 'Connect',
    disconnect: 'Disconnect',
    connected: 'Connected',
    connectError: 'Connection error',
    google: 'Google',
    apple: 'Apple',
  },
};

const providers = [
  {
    id: 'google' as const,
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bgColor: 'bg-white border',
    textColor: 'text-gray-700',
  },
  {
    id: 'apple' as const,
    name: 'Apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
    bgColor: 'bg-black',
    textColor: 'text-white',
  },
];

export function ConnectedAccountsSection() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Check which providers are connected based on user identities
  const connectedProviders = user?.app_metadata?.providers || [];

  const handleConnect = async (providerId: 'google' | 'apple') => {
    setConnectingProvider(providerId);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerId,
        options: { redirectTo: window.location.origin },
      });
      
      if (error) {
        toast.error(t.connectError);
        console.error('OAuth error:', error);
      }
    } catch (error) {
      toast.error(t.connectError);
      console.error('Connect error:', error);
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <Link2 className="w-4 h-4" />
        {t.sectionTitle}
      </div>
      <SectionCard>
        <p className="text-xs text-muted-foreground mb-4">{t.sectionDesc}</p>
        <div className="space-y-3">
          {providers.map((provider) => {
            const isConnected = connectedProviders.includes(provider.id);
            const isConnecting = connectingProvider === provider.id;
            
            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${provider.bgColor} ${provider.textColor}`}>
                    {provider.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{provider.name}</p>
                    {isConnected && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t.connected}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={isConnected ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleConnect(provider.id)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <LoadingSpinner size="sm" />
                  ) : isConnected ? (
                    t.disconnect
                  ) : (
                    t.connect
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </motion.div>
  );
}

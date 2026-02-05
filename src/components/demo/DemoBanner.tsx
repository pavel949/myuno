import { motion } from 'framer-motion';
import { Sparkles, X, UserPlus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useLanguage } from '@/contexts/LanguageContext';

const texts = {
  en: {
    demo: 'Demo Mode',
    demoDesc: 'Explore the app without registration',
    vendorDemo: 'Vendor Demo',
    vendorDesc: 'See how partners manage their business',
    createAccount: 'Create Account',
    becomePartner: 'Become a Partner',
  },
  ru: {
    demo: 'Демо-режим',
    demoDesc: 'Изучите приложение без регистрации',
    vendorDemo: 'Демо для партнёров',
    vendorDesc: 'Посмотрите, как партнёры управляют бизнесом',
    createAccount: 'Создать аккаунт',
    becomePartner: 'Стать партнёром',
  },
  th: {
    demo: 'โหมดสาธิต',
    demoDesc: 'สำรวจแอปโดยไม่ต้องลงทะเบียน',
    vendorDemo: 'สาธิตสำหรับผู้ขาย',
    vendorDesc: 'ดูว่าพาร์ทเนอร์จัดการธุรกิจอย่างไร',
    createAccount: 'สร้างบัญชี',
    becomePartner: 'เป็นพาร์ทเนอร์',
  },
};

export const DemoBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { demoType, trackDemoAction } = useDemoMode();
  const { language } = useLanguage();
  const t = texts[language] || texts.en;

  if (dismissed) return null;

  const isVendor = demoType === 'vendor';

  const handleCTA = () => {
    trackDemoAction('cta_clicked', { type: isVendor ? 'become_partner' : 'create_account' });
    navigate(isVendor ? '/info/become-partner' : '/auth');
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground shadow-lg"
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-full">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-center">
            <span className="font-semibold text-sm">
              {isVendor ? t.vendorDemo : t.demo}
            </span>
            <span className="text-xs opacity-90 hidden sm:inline">
              — {isVendor ? t.vendorDesc : t.demoDesc}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8"
            onClick={handleCTA}
          >
            {isVendor ? (
              <>
                <Briefcase className="w-3 h-3 mr-1" />
                {t.becomePartner}
              </>
            ) : (
              <>
                <UserPlus className="w-3 h-3 mr-1" />
                {t.createAccount}
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => {
              trackDemoAction('banner_dismissed');
              setDismissed(true);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

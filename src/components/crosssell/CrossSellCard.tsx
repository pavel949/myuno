import { pickLang } from '@/lib/i18n/pickLang';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconBadge } from '@/components/ui/IconBadge';
import type { CrossSellLink } from '@/lib/crossSellConfig';

interface CrossSellCardProps {
  link: CrossSellLink;
  index?: number;
}

export const CrossSellCard = memo(function CrossSellCard({ 
  link, 
  index = 0 
}: CrossSellCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleClick = () => {
    navigate(link.path);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={handleClick}
      className="flex h-full w-full min-w-0 flex-col items-center justify-center border border-border bg-card p-4 text-center transition-colors hover:border-primary/30"
    >
      <IconBadge
        icon={link.icon}
        size="lg"
        variant={link.gradient ? 'gradient' : 'primary'}
        gradient={link.gradient}
        className="mb-2"
      />
      <span className="w-full break-words whitespace-normal text-sm font-medium leading-snug text-foreground">
        {pickLang(language, { ru: link.labelRu, en: link.labelEn, th: link.labelTh })}
      </span>
      {(link.descriptionEn || link.descriptionRu) && (
        <span className="mt-1 w-full break-words whitespace-normal text-xs leading-snug text-muted-foreground">
          {pickLang(language, { ru: link.descriptionRu || '', en: link.descriptionEn || '', th: link.descriptionTh })}
        </span>
      )}
    </motion.button>
  );
});

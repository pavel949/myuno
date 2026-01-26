import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { IconBadge } from '@/components/ui/IconBadge';
import type { CrossSellLink } from '@/lib/crossSellConfig';

interface CrossSellCardProps {
  link: CrossSellLink;
  fromVertical: string;
  index?: number;
}

export const CrossSellCard = memo(function CrossSellCard({ 
  link, 
  fromVertical,
  index = 0 
}: CrossSellCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const handleClick = () => {
    // Track cross-sell click (can be expanded with analytics)
    console.log(`Cross-sell: ${fromVertical} → ${link.id}`);
    navigate(link.path);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-4 bg-card border border-border rounded-xl hover:shadow-lg hover:border-primary/30 transition-all duration-200 min-w-[100px] w-full"
    >
      <IconBadge
        icon={link.icon}
        size="lg"
        variant={link.gradient ? 'gradient' : 'primary'}
        gradient={link.gradient}
        className="mb-2"
      />
      <span className="font-medium text-sm text-foreground truncate w-full text-center">
        {language === 'ru' ? link.labelRu : link.labelEn}
      </span>
      {(link.descriptionEn || link.descriptionRu) && (
        <span className="text-xs text-muted-foreground truncate w-full text-center mt-0.5">
          {language === 'ru' ? link.descriptionRu : link.descriptionEn}
        </span>
      )}
    </motion.button>
  );
});

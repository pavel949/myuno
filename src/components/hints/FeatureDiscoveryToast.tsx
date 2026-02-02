import { useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useHints } from '@/hooks/useHints';

interface FeatureDiscoveryToastProps {
  id: string;
  title: string;
  description: string;
  showOnce?: boolean;
  delay?: number;
  duration?: number;
}

export function useFeatureDiscoveryToast() {
  const { isFeatureDiscovered, markFeatureDiscovered } = useHints();

  const showFeatureTip = ({
    id,
    title,
    description,
    showOnce = true,
    delay = 1000,
    duration = 5000,
  }: FeatureDiscoveryToastProps) => {
    if (showOnce && isFeatureDiscovered(id)) {
      return;
    }

    setTimeout(() => {
      toast(title, {
        description,
        icon: <Lightbulb className="w-4 h-4 text-warning" />,
        duration,
        action: {
          label: 'Понятно',
          onClick: () => {
            if (showOnce) {
              markFeatureDiscovered(id);
            }
          },
        },
      });

      if (showOnce) {
        markFeatureDiscovered(id);
      }
    }, delay);
  };

  return { showFeatureTip };
}

// Predefined feature tips for common scenarios
export const FEATURE_TIPS = {
  FAVORITES: {
    id: 'favorites-tip',
    title: '💡 Совет',
    description: 'Добавьте в избранное, чтобы быстро находить понравившиеся услуги',
  },
  WALLET: {
    id: 'wallet-tip',
    title: '💰 Кэшбек',
    description: 'Получайте до 10% возврата с каждого бронирования в UNO Wallet',
  },
  REVIEWS: {
    id: 'reviews-tip',
    title: '⭐ Отзывы',
    description: 'Оставьте отзыв после визита и получите бонусные баллы',
  },
  SOS: {
    id: 'sos-tip',
    title: '🆘 Экстренная помощь',
    description: 'Кнопка SOS доступна 24/7 для любых экстренных ситуаций',
  },
  ESCROW: {
    id: 'escrow-tip',
    title: '🛡️ Защита платежей',
    description: 'Ваши деньги защищены до подтверждения оказания услуги',
  },
  CHAT: {
    id: 'chat-tip',
    title: '💬 Чат с провайдером',
    description: 'Общайтесь напрямую с исполнителем через безопасный чат',
  },
};

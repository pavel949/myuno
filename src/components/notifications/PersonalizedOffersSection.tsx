import React, { useState, useEffect } from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SmartNotificationCard } from './SmartNotificationCard';
import { useViewHistory } from '@/hooks/useViewHistory';

interface PersonalizedOffer {
  id: string;
  type: 'promo' | 'reminder' | 'recommendation' | 'trending';
  title: string;
  title_ru: string;
  description: string;
  description_ru: string;
  discount?: number;
  promoCode?: string;
  actionPath: string;
  actionLabel?: string;
  actionLabel_ru?: string;
  image?: string;
}

// Demo offers - in production these would come from backend
const demoOffers: PersonalizedOffer[] = [
  {
    id: '1',
    type: 'promo',
    title: 'First Booking Discount!',
    title_ru: 'Скидка на первое бронирование!',
    description: 'Get 15% off your first tour or activity booking',
    description_ru: 'Получите скидку 15% на первый тур или активность',
    discount: 15,
    promoCode: 'WELCOME15',
    actionPath: '/experiences',
    actionLabel: 'Browse Experiences',
    actionLabel_ru: 'Смотреть впечатления',
  },
  {
    id: '2',
    type: 'trending',
    title: 'Popular This Week',
    title_ru: 'Популярно на этой неделе',
    description: 'Phi Phi Islands tour is trending! 50+ bookings today',
    description_ru: 'Тур на острова Пхи-Пхи в тренде! 50+ бронирований сегодня',
    actionPath: '/experiences',
    actionLabel: 'View Experience',
    actionLabel_ru: 'Посмотреть',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=200',
  },
];

export function PersonalizedOffersSection() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { history } = useViewHistory();
  const [offers, setOffers] = useState<PersonalizedOffer[]>([]);
  const [dismissedOffers, setDismissedOffers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myuno-dismissed-offers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Generate personalized offers based on history
    const personalizedOffers: PersonalizedOffer[] = [...demoOffers];

    // Add recommendation based on history
    if (history.length > 0) {
      const lastViewed = history[0];
      const data = lastViewed.item_data || {};
      
      personalizedOffers.push({
        id: 'history-rec',
        type: 'recommendation',
        title: 'Continue where you left off',
        title_ru: 'Продолжите где остановились',
        description: `You were viewing: ${data.name || data.name_en || 'an item'}`,
        description_ru: `Вы смотрели: ${data.name_ru || data.name || 'элемент'}`,
        actionPath: `/discover`,
        actionLabel: 'View More',
        actionLabel_ru: 'Смотреть ещё',
        image: data.image,
      });
    }

    // Filter out dismissed offers
    const filteredOffers = personalizedOffers.filter(o => !dismissedOffers.includes(o.id));
    setOffers(filteredOffers.slice(0, 3));
  }, [history, dismissedOffers]);

  const handleDismiss = (offerId: string) => {
    const newDismissed = [...dismissedOffers, offerId];
    setDismissedOffers(newDismissed);
    localStorage.setItem('myuno-dismissed-offers', JSON.stringify(newDismissed));
  };

  if (offers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-lg">
            <Gift className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Персональные предложения' : 'Personalized Offers'}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => (
          <SmartNotificationCard
            key={offer.id}
            type={offer.type}
            title={language === 'ru' ? offer.title_ru : offer.title}
            description={language === 'ru' ? offer.description_ru : offer.description}
            discount={offer.discount}
            promoCode={offer.promoCode}
            actionPath={offer.actionPath}
            actionLabel={language === 'ru' ? offer.actionLabel_ru : offer.actionLabel}
            image={offer.image}
            onDismiss={() => handleDismiss(offer.id)}
          />
        ))}
      </div>
    </div>
  );
}

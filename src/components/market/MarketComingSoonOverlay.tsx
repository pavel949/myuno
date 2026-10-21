import '@/styles/public-commerce.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

/** Set to true only after the marketplace launch has been verified. */
export const MARKET_ENABLED = false;

const copy = {
  en: {
    title: 'Market is not available yet',
    description: 'Product browsing and ordering are not available yet. You can browse services or return to the home page.',
    services: 'Browse services',
    home: 'Go home',
  },
  ru: {
    title: 'Маркет пока недоступен',
    description: 'Просмотр и заказ товаров пока недоступны. Вы можете перейти к услугам или вернуться на главную.',
    services: 'Перейти к услугам',
    home: 'На главную',
  },
  th: {
    title: 'ตลาดยังไม่เปิดให้บริการ',
    description: 'ยังไม่สามารถดูหรือสั่งซื้อสินค้าได้ในขณะนี้ คุณสามารถดูบริการหรือกลับไปหน้าหลัก',
    services: 'ดูบริการ',
    home: 'กลับหน้าหลัก',
  },
};

/** Legacy export name retained for compatibility; this is now an ordinary page section. */
export const MarketComingSoonOverlay: React.FC = () => {
  const { language } = useLanguage();
  const text = copy[language as keyof typeof copy] || copy.en;

  if (MARKET_ENABLED) return null;

  return (
    <section aria-labelledby="market-unavailable-title" className="public-commerce public-commerce--market mx-auto flex min-h-[55vh] w-full max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-none bg-primary/10">
        <ShoppingBag className="h-10 w-10 text-primary" aria-hidden="true" />
      </div>
      <h1 id="market-unavailable-title" className="public-commerce-title text-foreground">
        {text.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{text.description}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="min-h-11 flex-1 gap-2">
          <Link to="/services">{text.services}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11 flex-1 gap-2">
          <Link to="/"><Home className="h-4 w-4" aria-hidden="true" />{text.home}</Link>
        </Button>
      </div>
    </section>
  );
};

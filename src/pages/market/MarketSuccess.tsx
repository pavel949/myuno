import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function MarketSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>

            <h1 className="text-xl font-bold mb-2">
              {isRu ? 'Оплата прошла успешно!' : 'Payment Successful!'}
            </h1>

            <p className="text-muted-foreground mb-6">
              {isRu
                ? 'Ваш заказ оформлен. Мы свяжемся с вами для подтверждения доставки.'
                : 'Your order has been placed. We will contact you to confirm delivery.'}
            </p>

            <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-medium mb-2">
                {isRu ? 'Что дальше:' : 'What happens next:'}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  {isRu ? 'Продавец подготовит ваш заказ' : 'Seller prepares your order'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  {isRu ? 'Мы организуем доставку' : 'We arrange delivery'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  {isRu ? 'Вы получите заказ в указанное время' : 'You receive your order at the scheduled time'}
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={() => navigate('/market')} className="w-full">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {isRu ? 'Продолжить покупки' : 'Continue Shopping'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                {isRu ? 'На главную' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

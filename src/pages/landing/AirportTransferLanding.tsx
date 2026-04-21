import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Globe, CreditCard, Plane, Clock, MapPin, CheckCircle, UserCheck, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { SocialProofCounter } from '@/components/landing/SocialProofCounter';
import type { Variants, Easing } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as Easing },
  }),
};

export default function AirportTransferLanding() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleBook = () => navigate('/transport/airport-transfer');

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Трансфер из аэропорта Пхукета — Фиксированная цена' : 'Phuket Airport Transfer — Fixed Price, Verified Drivers'}</title>
        <meta name="description" content={isRu
          ? 'Закажите трансфер из аэропорта Пхукета. Фиксированная цена, проверенные водители, встреча в аэропорту.'
          : 'Book your Phuket airport transfer. Fixed price, verified drivers, meet & greet at arrival.'
        } />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />

          <div className="relative max-w-lg mx-auto px-5 pt-12 pb-8">
            {/* Micro-brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 mb-6"
            >
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">U</span>
              </div>
              <span className="text-sm font-semibold text-foreground/70">myUNO</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-3xl sm:text-4xl font-display font-bold leading-tight text-foreground"
            >
              {isRu
                ? <>Не ищите такси в аэропорту Пхукета</>
                : <>Don't hunt for a taxi at Phuket airport</>
              }
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-3 text-base text-muted-foreground leading-relaxed"
            >
              {isRu
                ? 'Водитель уже ждёт вас. Фиксированная цена. Без сюрпризов.'
                : 'Your driver is already waiting. Fixed price. No surprises.'
              }
            </motion.p>

            {/* Trust chips */}
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2 mt-5"
            >
              {[
                { icon: ShieldCheck, label: isRu ? 'Проверенные водители' : 'Verified drivers' },
                { icon: Globe, label: isRu ? 'EN / RU / TH' : 'EN / RU / TH' },
                { icon: CreditCard, label: isRu ? 'Оплата картой' : 'Pay by card' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/15"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-8"
            >
              <Button
                onClick={handleBook}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                <Car className="w-5 h-5 mr-2" />
                {isRu ? 'Забронировать трансфер' : 'Book My Transfer'}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2.5">
                {isRu ? '฿800–1 500 · Без предоплаты' : '฿800–1,500 · No prepayment required'}
              </p>
              <div className="mt-4">
                <SocialProofCounter vertical="transfer" variant="banner" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── WHAT'S INCLUDED ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">
            {isRu ? 'Что входит в стоимость' : "What's included"}
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: UserCheck,
                title: isRu ? 'Встреча в аэропорту' : 'Meet & greet at arrivals',
                desc: isRu
                  ? 'Водитель встретит вас с табличкой сразу после выхода из зоны получения багажа.'
                  : 'Your driver meets you with a name sign right after you exit baggage claim.',
              },
              {
                icon: Car,
                title: isRu ? 'Комфортный автомобиль' : 'Comfortable vehicle',
                desc: isRu
                  ? 'Седан или минивэн с кондиционером. Место для багажа. Детское кресло по запросу.'
                  : 'Sedan or minivan with AC. Space for luggage. Child seat on request.',
              },
              {
                icon: MapPin,
                title: isRu ? 'Доставка до двери' : 'Door-to-door delivery',
                desc: isRu
                  ? 'Прямо до вашего отеля, виллы или кондо. Без пересадок и остановок.'
                  : 'Straight to your hotel, villa, or condo. No stops, no transfers.',
              },
              {
                icon: CreditCard,
                title: isRu ? 'Фиксированная цена' : 'Fixed price',
                desc: isRu
                  ? 'Цена зависит только от расстояния. Никаких скрытых доплат. Пробки не влияют на стоимость.'
                  : 'Price depends on distance only. No hidden fees. Traffic doesn\'t change the fare.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3.5">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm font-semibold text-foreground mb-1">
              {isRu ? 'Стоимость' : 'Pricing'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">฿800–1,500</span>
              <span className="text-xs text-muted-foreground">
                {isRu ? 'в зависимости от расстояния' : 'depending on distance'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {isRu
                ? 'Цена фиксирована. Без скрытых доплат. Водитель включён.'
                : 'Price is fixed. No hidden fees. Professional driver included.'
              }
            </p>
          </div>
        </section>

        {/* ─── TRUST: WHAT USUALLY GOES WRONG ─── */}
        <section className="bg-muted/30">
          <div className="max-w-lg mx-auto px-5 py-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isRu ? 'Что обычно идёт не так' : 'What usually goes wrong'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'И как мы убираем каждый из этих рисков.'
                : 'And how we remove each of these risks.'
              }
            </p>

            <div className="space-y-5">
              {[
                {
                  problem: isRu ? 'Таксисты завышают цену на месте' : 'Taxi drivers overcharge on the spot',
                  solution: isRu ? 'Цена фиксируется до поездки' : 'Price is locked before the ride',
                },
                {
                  problem: isRu ? 'Водитель не говорит на вашем языке' : 'Driver doesn\'t speak your language',
                  solution: isRu ? 'Все водители говорят на EN или RU' : 'All drivers speak EN or RU',
                },
                {
                  problem: isRu ? 'Никто не встречает — ищете сами' : 'Nobody meets you — you\'re on your own',
                  solution: isRu ? 'Водитель с табличкой у выхода' : 'Driver with a name sign at the exit',
                },
                {
                  problem: isRu ? 'Нет места для чемоданов' : 'No space for luggage',
                  solution: isRu ? 'Минивэн или седан — под ваш багаж' : 'Minivan or sedan — fits your luggage',
                },
              ].map(({ problem, solution }) => (
                <div key={problem} className="flex gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <div className="w-5 h-5 rounded-full bg-destructive/15 flex items-center justify-center">
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    </div>
                    <div className="w-px h-full bg-border" />
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-success" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground line-through decoration-destructive/40">{problem}</p>
                    <p className="text-sm font-medium text-foreground mt-1.5">{solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">
            {isRu ? 'Как это работает' : 'How it works'}
          </h2>

          <div className="space-y-6">
            {[
              {
                step: '1',
                icon: Plane,
                title: isRu ? 'Укажите рейс и адрес' : 'Enter your flight & address',
                desc: isRu
                  ? 'Дата, время, номер рейса и куда ехать.'
                  : 'Date, time, flight number, and where to go.',
              },
              {
                step: '2',
                icon: CheckCircle,
                title: isRu ? 'Получите подтверждение' : 'Get instant confirmation',
                desc: isRu
                  ? 'Водитель и цена — сразу. Без ожидания.'
                  : 'Driver and price — instantly. No waiting.',
              },
              {
                step: '3',
                icon: Car,
                title: isRu ? 'Вас встретят в аэропорту' : 'Get picked up at the airport',
                desc: isRu
                  ? 'Водитель с табличкой. Вам не нужно ничего искать.'
                  : 'Driver with your name sign. You don\'t need to look for anything.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            {isRu
              ? 'Регистрация не нужна. Бронирование занимает 30 секунд.'
              : 'No registration needed. Booking takes 30 seconds.'
            }
          </p>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-lg mx-auto px-5 pb-12 pt-2">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15">
            <h2 className="text-lg font-display font-bold text-foreground text-center">
              {isRu
                ? 'Водитель будет ждать вас'
                : 'Your driver will be waiting'
              }
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 mb-5">
              {isRu
                ? 'Закажите сейчас — оплатите при встрече.'
                : 'Book now — pay when you arrive.'
              }
            </p>
            <Button
              onClick={handleBook}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              {isRu ? 'Забронировать трансфер' : 'Book My Transfer'}
            </Button>
          </div>

          {/* Soft bridge */}
          <p className="text-center text-[11px] text-muted-foreground mt-5 leading-relaxed max-w-xs mx-auto">
            {isRu
              ? 'Бронирование сохраняется в вашем аккаунте myUNO. Вы сможете отслеживать статус и связаться с водителем.'
              : 'Your booking is saved in your myUNO account. You can track status and contact your driver anytime.'
            }
          </p>
        </section>
      </div>
    </>
  );
}

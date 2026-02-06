import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Camera, Clock, CreditCard, CheckCircle, Flower2, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Variants, Easing } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as Easing },
  }),
};

export default function FlowerDeliveryLanding() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleOrder = () => navigate('/flowers');

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Доставка цветов в Пхукете — Фиксированная цена, реальные фото' : 'Flower Delivery in Phuket — Fixed Price, Real Photos'}</title>
        <meta name="description" content={isRu
          ? 'Закажите букет в Пхукете. Реальные фото, фиксированная цена, доставка в тот же день.'
          : 'Order flowers in Phuket. Real photos, fixed price, same-day delivery.'
        } />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />

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
                ? <>Цветы в Пхукете. Именно такие, как на фото.</>
                : <>Flowers in Phuket. Exactly as pictured.</>
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
                ? 'Доставка в тот же день. Фиксированная цена. Без неприятных сюрпризов.'
                : 'Same-day delivery. Fixed price. No unpleasant surprises.'
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
                { icon: Camera, label: isRu ? 'Реальные фото' : 'Real photos' },
                { icon: CreditCard, label: isRu ? 'Фикс. цена' : 'Fixed price' },
                { icon: MessageCircle, label: isRu ? 'Поддержка EN/RU' : 'EN/RU support' },
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
                onClick={handleOrder}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                <Flower2 className="w-5 h-5 mr-2" />
                {isRu ? 'Выбрать букет' : 'Choose a Bouquet'}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2.5">
                {isRu ? 'от ฿1 200 · Доставка сегодня' : 'From ฿1,200 · Delivered today'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── PRODUCT CLARITY ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">
            {isRu ? 'Что вы получите' : 'What you get'}
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: Camera,
                title: isRu ? 'Букет как на фото' : 'Bouquet as pictured',
                desc: isRu
                  ? 'Каждый дизайн снят в студии. Размер влияет на количество цветов — стиль и палитра всегда совпадают.'
                  : 'Every design is studio-photographed. Size affects flower count — style and color palette always match.',
              },
              {
                icon: Clock,
                title: isRu ? 'Доставка в тот же день' : 'Same-day delivery',
                desc: isRu
                  ? 'Закажите до 14:00 — доставим сегодня. Выберите удобный временной слот.'
                  : 'Order before 2 PM — delivered today. Choose a convenient time slot.',
              },
              {
                icon: Heart,
                title: isRu ? 'Открытка с вашим текстом' : 'Card with your message',
                desc: isRu
                  ? 'Добавьте персональное сообщение. Мы напечатаем его на карточке и вложим в букет.'
                  : 'Add a personal message. We print it on a card and include it with the bouquet.',
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
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRu
                ? 'Некоторые цветы могут быть заменены сезонными аналогами. Стиль, палитра и ценность букета сохраняются.'
                : 'Some flowers may be substituted seasonally while preserving style, color palette, and value.'
              }
            </p>
          </div>
        </section>

        {/* ─── TRUST: WHAT GOES WRONG ─── */}
        <section className="bg-muted/30">
          <div className="max-w-lg mx-auto px-5 py-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isRu ? 'Почему не через WhatsApp' : 'Why not through WhatsApp'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'Частые проблемы при заказе цветов через чаты.'
                : 'Common problems when ordering flowers through chats.'
              }
            </p>

            <div className="space-y-5">
              {[
                {
                  problem: isRu ? 'Фото одно, а привозят другое' : 'Photo shows one thing, you get another',
                  solution: isRu ? 'Студийные фото каждого дизайна' : 'Studio photos of every design',
                },
                {
                  problem: isRu ? 'Цена растёт после «уточнения»' : 'Price goes up after "clarification"',
                  solution: isRu ? 'Фиксированная цена на сайте' : 'Fixed price on the website',
                },
                {
                  problem: isRu ? 'Нет ответа, когда срочно' : 'No reply when it\'s urgent',
                  solution: isRu ? 'Подтверждение заказа сразу' : 'Instant order confirmation',
                },
                {
                  problem: isRu ? 'Непонятно, доставили или нет' : 'No idea if it was delivered',
                  solution: isRu ? 'Уведомление о доставке' : 'Delivery notification',
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
            {isRu ? 'Как заказать' : 'How to order'}
          </h2>

          <div className="space-y-6">
            {[
              {
                step: '1',
                icon: Flower2,
                title: isRu ? 'Выберите букет' : 'Choose a bouquet',
                desc: isRu
                  ? 'Размер, стиль и палитра — всё видно на фото.'
                  : 'Size, style, and palette — all visible in photos.',
              },
              {
                step: '2',
                icon: MessageCircle,
                title: isRu ? 'Укажите адрес и время' : 'Enter address and time',
                desc: isRu
                  ? 'Куда и когда доставить. Можно добавить текст для открытки.'
                  : 'Where and when to deliver. You can add a card message.',
              },
              {
                step: '3',
                icon: CheckCircle,
                title: isRu ? 'Оплатите и готово' : 'Pay and done',
                desc: isRu
                  ? 'Картой или при получении. Подтверждение — сразу.'
                  : 'By card or on delivery. Confirmation — instant.',
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
              ? 'Без регистрации. Заказ за 30 секунд.'
              : 'No registration needed. Order in 30 seconds.'
            }
          </p>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-lg mx-auto px-5 pb-12 pt-2">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15">
            <h2 className="text-lg font-display font-bold text-foreground text-center">
              {isRu
                ? 'Пусть цветы скажут за вас'
                : 'Let flowers speak for you'
              }
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 mb-5">
              {isRu
                ? 'Выберите букет — мы доставим сегодня.'
                : 'Choose a bouquet — we deliver today.'
              }
            </p>
            <Button
              onClick={handleOrder}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              {isRu ? 'Выбрать букет' : 'Choose a Bouquet'}
            </Button>
          </div>

          {/* Soft bridge */}
          <p className="text-center text-[11px] text-muted-foreground mt-5 leading-relaxed max-w-xs mx-auto">
            {isRu
              ? 'Заказ сохраняется в вашем аккаунте myUNO. Повторный заказ — в один клик.'
              : 'Your order is saved in your myUNO account. Reorder anytime in one click.'
            }
          </p>
        </section>
      </div>
    </>
  );
}

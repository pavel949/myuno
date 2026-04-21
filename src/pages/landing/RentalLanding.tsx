import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, Home, CheckCircle, Search, Eye, Key, AlertTriangle, Users, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Variants, Easing } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as Easing },
  }),
};

export default function RentalLanding() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleCTA = () => navigate('/property?mode=rent');

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <title>{isRu ? 'Аренда жилья на Пхукете — Проверенные объекты' : 'Phuket Long-Term Rentals — Verified Listings'}</title>
        <meta name="description" content={isRu
          ? 'Аренда квартир и вилл на Пхукете на 1–12 месяцев. Проверенные собственники, реальные цены, прозрачные депозиты.'
          : 'Rent apartments and villas in Phuket for 1–12 months. Verified owners, real prices, transparent deposits.'
        } />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-background to-background" />

          <div className="relative max-w-lg mx-auto px-5 pt-12 pb-8">
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

            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-3xl sm:text-4xl font-display font-bold leading-tight text-foreground"
            >
              {isRu
                ? <>Хватит переплачивать брокерам на Пхукете</>
                : <>Stop overpaying brokers in Phuket</>
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
                ? 'Проверенные объекты. Реальные цены. Прямой контакт с собственником или верифицированным агентом.'
                : 'Verified listings. Real prices. Direct contact with owners or verified agents.'
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
                { icon: ShieldCheck, label: isRu ? 'Проверенные объекты' : 'Verified listings' },
                { icon: FileText, label: isRu ? 'Прозрачные депозиты' : 'Transparent deposits' },
                { icon: Scale, label: isRu ? 'Защита арендатора' : 'Tenant protection' },
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
                onClick={handleCTA}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                <Search className="w-5 h-5 mr-2" />
                {isRu ? 'Смотреть проверенные объекты' : 'View Verified Rentals'}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2.5">
                {isRu ? 'Аренда от 1 до 12 месяцев · Виллы, кондо, дома' : '1–12 month rentals · Villas, condos, houses'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── CORE OFFER ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">
            {isRu ? 'Что вы получаете' : 'What you get'}
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: Home,
                title: isRu ? 'Долгосрочная аренда' : 'Mid & long-term rentals',
                desc: isRu
                  ? 'Объекты для проживания от 1 месяца. Виллы, кондо, дома — от собственников и проверенных агентов.'
                  : 'Properties for stays of 1 month and longer. Villas, condos, houses — from owners and verified agents.',
              },
              {
                icon: Users,
                title: isRu ? 'Прямой контакт' : 'Direct access',
                desc: isRu
                  ? 'Связывайтесь напрямую с собственником или верифицированным агентом. Без посредников и переплат.'
                  : 'Connect directly with the owner or a verified agent. No middlemen, no markups.',
              },
              {
                icon: FileText,
                title: isRu ? 'Прозрачные условия' : 'Transparent terms',
                desc: isRu
                  ? 'Депозит, стоимость коммунальных услуг и правила дома — всё указано до бронирования.'
                  : 'Deposit, utility costs, and house rules — everything is stated upfront before you commit.',
              },
              {
                icon: ShieldCheck,
                title: isRu ? 'Проверенные объекты' : 'Verified properties',
                desc: isRu
                  ? 'Каждый объект проходит проверку. Реальные фото, актуальные цены, подтверждённая доступность.'
                  : 'Every property is reviewed. Real photos, current prices, confirmed availability.',
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
        </section>

        {/* ─── TRUST: WHAT GOES WRONG ─── */}
        <section className="bg-muted/30">
          <div className="max-w-lg mx-auto px-5 py-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isRu ? 'Типичные проблемы с арендой' : 'Typical rental problems'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'И как UNO защищает вас от каждой из них.'
                : 'And how UNO protects you from each one.'
              }
            </p>

            <div className="space-y-5">
              {[
                {
                  problem: isRu ? 'Цена на месте выше, чем в объявлении' : 'Price on arrival is higher than listed',
                  solution: isRu ? 'Цена фиксируется в листинге и контракте' : 'Price is locked in the listing and contract',
                },
                {
                  problem: isRu ? 'Депозит не возвращают без причины' : 'Deposit withheld without justification',
                  solution: isRu ? 'Условия возврата прописаны заранее' : 'Return terms are documented upfront',
                },
                {
                  problem: isRu ? 'Фото не соответствуют реальности' : 'Photos don\'t match reality',
                  solution: isRu ? 'Фото проверяются перед публикацией' : 'Photos are verified before publishing',
                },
                {
                  problem: isRu ? 'Брокер исчезает после оплаты' : 'Broker disappears after payment',
                  solution: isRu ? 'Все собственники и агенты верифицированы' : 'All owners and agents are verified',
                },
                {
                  problem: isRu ? 'Скрытые платежи за коммунальные' : 'Hidden utility charges',
                  solution: isRu ? 'Все расходы указаны в описании' : 'All costs are listed in the description',
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
                icon: Search,
                title: isRu ? 'Выберите объект' : 'Browse listings',
                desc: isRu
                  ? 'Фильтруйте по району, типу и бюджету. Все цены актуальны.'
                  : 'Filter by district, type, and budget. All prices are current.',
              },
              {
                step: '2',
                icon: Eye,
                title: isRu ? 'Запросите просмотр' : 'Request a viewing',
                desc: isRu
                  ? 'Свяжитесь с собственником или агентом. Назначьте время визита.'
                  : 'Contact the owner or agent. Schedule a time to visit.',
              },
              {
                step: '3',
                icon: Key,
                title: isRu ? 'Оформите аренду через UNO' : 'Secure your rental via UNO',
                desc: isRu
                  ? 'Договор, депозит и заселение — всё фиксируется в системе.'
                  : 'Contract, deposit, and move-in — everything is recorded in the system.',
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
              ? 'Без регистрации для просмотра. Аккаунт нужен только при бронировании.'
              : 'No registration to browse. Account needed only when booking.'
            }
          </p>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-lg mx-auto px-5 pb-12 pt-2">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15">
            <h2 className="text-lg font-display font-bold text-foreground text-center">
              {isRu
                ? 'Найдите жильё без переплат'
                : 'Find a home without overpaying'
              }
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 mb-5">
              {isRu
                ? 'Проверенные объекты. Реальные цены. Прозрачные условия.'
                : 'Verified listings. Real prices. Transparent terms.'
              }
            </p>
            <Button
              onClick={handleCTA}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              {isRu ? 'Смотреть проверенные объекты' : 'View Verified Rentals'}
            </Button>
          </div>

          {/* Soft bridge */}
          <p className="text-center text-[11px] text-muted-foreground mt-5 leading-relaxed max-w-xs mx-auto">
            {isRu
              ? 'Ваша аренда сохраняется в аккаунте myUNO. История договоров, продление и контакты — в одном месте.'
              : 'Your rental is saved in your myUNO account. Contract history, renewals, and contacts — all in one place.'
            }
          </p>
        </section>
      </div>
    </AppLayout>
  );
}

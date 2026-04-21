import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BarChart3, FileSearch, CheckCircle, Search, ClipboardCheck, BookOpen, AlertTriangle, Building2, Scale, TrendingUp } from 'lucide-react';
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

export default function NewDevelopmentsLanding() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const handleBrowse = () => navigate('/property?mode=buy&type=offplan');
  const handleDD = () => navigate('/property?mode=buy&type=offplan');

  return (
    <AppLayout showHeader={false}>
      <Helmet>
        <title>{isRu ? 'Новостройки Пхукета — Независимая оценка проектов' : 'Phuket New Developments — Independent Project Ratings'}</title>
        <meta name="description" content={isRu
          ? 'Независимая оценка новостроек Пхукета. Рейтинги проектов, проверка застройщиков, анализ рисков.'
          : 'Independent ratings for Phuket new developments. Project scoring, developer track records, risk analysis.'
        } />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />

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
                ? <>Не каждый проект на Пхукете стоит ваших денег</>
                : <>Not every Phuket project is worth your money</>
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
                ? 'Независимые рейтинги проектов. Проверка застройщиков. Оценка рисков — до того, как вы подпишете контракт.'
                : 'Independent project ratings. Developer due diligence. Risk assessment — before you sign anything.'
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
                { icon: BarChart3, label: isRu ? 'Рейтинг проектов' : 'Project ratings' },
                { icon: FileSearch, label: isRu ? 'Due Diligence' : 'Due diligence' },
                { icon: Scale, label: isRu ? 'Без конфликта интересов' : 'No conflict of interest' },
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
                onClick={handleBrowse}
                size="lg"
                className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                <Building2 className="w-5 h-5 mr-2" />
                {isRu ? 'Смотреть проверенные проекты' : 'View Rated Projects'}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2.5">
                {isRu ? 'Каждый проект оценён по 5 критериям' : 'Every project scored across 5 criteria'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── CORE OFFER ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">
            {isRu ? 'Что мы проверяем' : 'What we evaluate'}
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: BarChart3,
                title: isRu ? 'Рейтинг проекта' : 'Project rating',
                desc: isRu
                  ? 'Единый балл от 0 до 100, учитывающий локацию, застройщика, финансы и рыночный спрос.'
                  : 'A single score from 0 to 100, factoring in location, developer, financials, and market demand.',
              },
              {
                icon: Building2,
                title: isRu ? 'Репутация застройщика' : 'Developer track record',
                desc: isRu
                  ? 'Сколько проектов сдано в срок. Были ли задержки. Финансовая устойчивость.'
                  : 'How many projects delivered on time. Delay history. Financial stability.',
              },
              {
                icon: AlertTriangle,
                title: isRu ? 'Строительные риски' : 'Construction risks',
                desc: isRu
                  ? 'Текущий этап строительства. Вероятность задержки. Качество материалов.'
                  : 'Current build stage. Delay probability. Material quality.',
              },
              {
                icon: FileSearch,
                title: isRu ? 'Юридическая проверка' : 'Legal assessment',
                desc: isRu
                  ? 'Правовой статус земли. Разрешения на строительство. Структура владения для иностранцев.'
                  : 'Land title status. Building permits. Foreign ownership structure.',
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

        {/* ─── TRUST: WHY BUYERS LOSE MONEY ─── */}
        <section className="bg-muted/30">
          <div className="max-w-lg mx-auto px-5 py-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isRu ? 'Почему покупатели теряют деньги' : 'Why buyers lose money'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'Большинство агентов продают проекты, от которых получают комиссию. Мы — нет.'
                : 'Most agents sell projects they earn commission from. We don\'t.'
              }
            </p>

            <div className="space-y-5">
              {[
                {
                  problem: isRu ? 'Агент рекомендует проект с высокой комиссией' : 'Agent recommends projects with high commission',
                  solution: isRu ? 'UNO не получает комиссию от застройщиков' : 'UNO earns no commission from developers',
                },
                {
                  problem: isRu ? 'Рендеры не соответствуют реальности' : 'Renders don\'t match reality',
                  solution: isRu ? 'Мы показываем реальный прогресс строительства' : 'We show actual construction progress',
                },
                {
                  problem: isRu ? 'Юридический статус земли не проверен' : 'Land title not verified',
                  solution: isRu ? 'Юридическая проверка входит в оценку' : 'Legal verification is part of the rating',
                },
                {
                  problem: isRu ? 'Обещанная доходность не подтверждена' : 'Promised returns are unverified',
                  solution: isRu ? 'Мы показываем данные, а не прогнозы' : 'We show data, not projections',
                },
                {
                  problem: isRu ? 'Застройщик без опыта завершённых проектов' : 'Developer has no completed projects',
                  solution: isRu ? 'Вся история застройщика в открытом доступе' : 'Full developer history is publicly available',
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

        {/* ─── RATING METHODOLOGY ─── */}
        <section className="max-w-lg mx-auto px-5 py-10">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            {isRu ? 'Как формируется рейтинг' : 'How the rating works'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRu
              ? 'Единый балл 0–100, скорректированный на риск. Пять критериев с прозрачными весами.'
              : 'A single 0–100 score, adjusted for risk. Five criteria with transparent weights.'
            }
          </p>

          <div className="space-y-3">
            {[
              { label: isRu ? 'Локация' : 'Location', weight: 25, desc: isRu ? 'Район, инфраструктура, потенциал роста' : 'District, infrastructure, growth potential' },
              { label: isRu ? 'Застройщик' : 'Developer', weight: 25, desc: isRu ? 'Опыт, завершённые проекты, репутация' : 'Experience, completed projects, reputation' },
              { label: isRu ? 'Финансы' : 'Financials', weight: 25, desc: isRu ? 'Цена за м², доходность, ликвидность' : 'Price per sqm, yield potential, liquidity' },
              { label: isRu ? 'Спрос' : 'Demand', weight: 15, desc: isRu ? 'Заполняемость района, динамика продаж' : 'Area occupancy, sales velocity' },
              { label: isRu ? 'Юр. безопасность' : 'Legal safety', weight: 10, desc: isRu ? 'Титул, разрешения, структура владения' : 'Title, permits, ownership structure' },
            ].map(({ label, weight, desc }) => (
              <div key={label} className="p-3.5 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs font-bold text-primary">{weight}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted mb-2">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${weight}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="bg-muted/30">
          <div className="max-w-lg mx-auto px-5 py-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">
              {isRu ? 'Как это работает' : 'How it works'}
            </h2>

            <div className="space-y-6">
              {[
                {
                  step: '1',
                  icon: Search,
                  title: isRu ? 'Изучите рейтинги проектов' : 'Browse rated projects',
                  desc: isRu
                    ? 'Каждый проект имеет единый балл и подробную разбивку по критериям.'
                    : 'Every project has a single score and detailed breakdown by criteria.',
                },
                {
                  step: '2',
                  icon: ClipboardCheck,
                  title: isRu ? 'Запросите Due Diligence' : 'Request due diligence',
                  desc: isRu
                    ? 'Профессиональная проверка юридического статуса, застройщика и финансовой модели.'
                    : 'Professional review of legal status, developer, and financial model.',
                },
                {
                  step: '3',
                  icon: BookOpen,
                  title: isRu ? 'Примите решение на основе данных' : 'Decide with verified data',
                  desc: isRu
                    ? 'Все отчёты и аналитика сохраняются в вашем аккаунте.'
                    : 'All reports and analysis are saved in your account.',
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
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-lg mx-auto px-5 pb-12 pt-10">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15">
            <h2 className="text-lg font-display font-bold text-foreground text-center">
              {isRu
                ? 'Проверьте проект до покупки'
                : 'Verify a project before you buy'
              }
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-1.5 mb-5">
              {isRu
                ? 'Независимые рейтинги. Проверка застройщиков. Анализ рисков.'
                : 'Independent ratings. Developer verification. Risk analysis.'
              }
            </p>
            <Button
              onClick={handleBrowse}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            >
              {isRu ? 'Смотреть проверенные проекты' : 'View Rated Projects'}
            </Button>
            <button
              onClick={handleDD}
              className="w-full mt-3 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors text-center"
            >
              {isRu ? 'Запросить Due Diligence →' : 'Request Due Diligence →'}
            </button>
          </div>

          {/* Soft bridge */}
          <p className="text-center text-[11px] text-muted-foreground mt-5 leading-relaxed max-w-xs mx-auto">
            {isRu
              ? 'Ваши исследования сохраняются в аккаунте myUNO. Рейтинги, отчёты и история запросов — в одном месте.'
              : 'Your research is saved in your myUNO account. Ratings, reports, and request history — all in one place.'
            }
          </p>
        </section>
      </div>
    </>
  );
}

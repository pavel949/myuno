/**
 * PEYLAA Landing Page — Premium Sales Page
 * /peylaa — Main entry point for PEYLAA sales funnel
 */
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2, MapPin, Calendar, Shield, Star, ChevronRight,
  Waves, Dumbbell, Baby, Bell, Crown, Users, Phone,
  ArrowRight, Play, Check, Calculator, MessageCircle,
  Home, Landmark, Heart, Sparkles, BedDouble, Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeylaaProject, usePeylaaStats, usePeylaaAmenities, usePeylaaGallery, formatThb } from '@/hooks/usePeylaa';
import { PeylaaLeadForm } from './components/PeylaaLeadForm';
import { PeylaaUnitCatalog } from './components/PeylaaUnitCatalog';
import { PeylaaROICalculator } from './components/PeylaaROICalculator';

const STORAGE_BASE = 'https://bhmvnorkswapjkmbvykk.supabase.co/storage/v1/object/public/media';
const HERO_BG = `${STORAGE_BASE}/exterior/peylaa_drone-shot-with-3d-building.jpg`;

const STATS = [
  { label: 'Корпуса', value: '3', icon: Building2 },
  { label: 'Резиденций', value: '408', icon: Home },
  { label: 'Этажей', value: '7', icon: Landmark },
  { label: 'Сдача', value: 'Q4 2027', icon: Calendar },
];

const KEY_FEATURES = [
  {
    icon: Crown,
    title: 'Первые в Азии',
    titleEn: 'First in Asia Pacific',
    desc: 'Autograph Collection Residences — эксклюзивный бренд Marriott International',
  },
  {
    icon: Star,
    title: 'Marriott Bonvoy Gold Elite',
    titleEn: 'Bonvoy Gold Elite',
    desc: 'Статус Gold Elite для всех владельцев. Скидки и привилегии в 30+ отелях мира',
  },
  {
    icon: Shield,
    title: 'Отельное управление',
    titleEn: 'Hotel Management',
    desc: 'Отель на 126 номеров Autograph Collection рядом — профессиональное управление вашей резиденцией',
  },
  {
    icon: Sparkles,
    title: 'Полная отделка',
    titleEn: 'Fully Furnished',
    desc: 'Премиальная мебель и отделка включены. Въезжай и живи или сдавай с первого дня',
  },
];

const PAYMENT_STEPS_FOREIGN = [
  { step: 'Резервация', pct: '', amount: '100K–300K ฿' },
  { step: 'Контракт (30 дней)', pct: '30%', amount: '' },
  { step: 'Сваи завершены', pct: '10%', amount: '' },
  { step: 'Каркас завершён', pct: '10%', amount: '' },
  { step: 'Стены и полы', pct: '10%', amount: '' },
  { step: 'Передача ключей', pct: '40%', amount: '' },
];

export default function PeylaaLanding() {
  const { data: project, isLoading: projectLoading } = usePeylaaProject();
  const { data: stats } = usePeylaaStats();
  const { data: amenities } = usePeylaaAmenities();
  const { data: gallery } = usePeylaaGallery();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormSource, setLeadFormSource] = useState('landing_form');
  const [searchParams] = useSearchParams();

  // Track UTM params
  const utm = {
    source: searchParams.get('utm_source') || undefined,
    medium: searchParams.get('utm_medium') || undefined,
    campaign: searchParams.get('utm_campaign') || undefined,
  };

  const totalAvailable = stats?.reduce((sum, s) => sum + s.available, 0) || 0;
  const minPrice = stats?.reduce((min, s) => {
    if (s.min_price && (!min || s.min_price < min)) return s.min_price;
    return min;
  }, null as number | null);

  const openLeadForm = (source: string) => {
    setLeadFormSource(source);
    setShowLeadForm(true);
  };

  const amenitiesByCategory = amenities?.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, typeof amenities>) || {};

  const seoTitle = 'PEYLAA Phuket — Autograph Collection Residences | от ฿7.1M';
  const seoDesc = 'Первый проект Autograph Collection в Азии. 408 премиальных резиденций в Bang Tao, Пхукет. Marriott Bonvoy Gold Elite. Полная отделка. Рассрочка до передачи ключей. Финансирование до 50%.';
  const ogImage = HERO_BG;
  const canonicalUrl = 'https://myuno.app/peylaa';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="PEYLAA Phuket — Autograph Collection Residences" />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="ru_RU" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:site_name" content="myUNO — PEYLAA Phuket" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PEYLAA Phuket — Autograph Collection Residences" />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={ogImage} />

        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'PEYLAA Phuket — Autograph Collection Residences',
          description: seoDesc,
          url: canonicalUrl,
          image: ogImage,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Bang Tao, Cherngtalay',
            addressLocality: 'Thalang',
            addressRegion: 'Phuket',
            postalCode: '83110',
            addressCountry: 'TH',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 7.987,
            longitude: 98.2946,
          },
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: 7100000,
            highPrice: 25000000,
            priceCurrency: 'THB',
            offerCount: totalAvailable || 232,
          },
          brand: {
            '@type': 'Brand',
            name: 'Autograph Collection by Marriott',
          },
        })}</script>
      </Helmet>

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
              PEYLAA
            </span>
            <Badge variant="outline" className="text-[10px] border-accent/40/50 text-accent">
              AUTOGRAPH COLLECTION
            </Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#gallery" className="hover:text-white transition-colors">Галерея</a>
            <a href="#units" className="hover:text-white transition-colors">Резиденции</a>
            <a href="#amenities" className="hover:text-white transition-colors">Инфраструктура</a>
            <a href="#roi" className="hover:text-white transition-colors">Инвестиции</a>
            <a href="#payment" className="hover:text-white transition-colors">Условия</a>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-accent/40/50 text-accent hover:bg-accent/10 hidden sm:flex"
              onClick={() => window.open('https://wa.me/66922407355?text=Здравствуйте! Интересует PEYLAA Phuket', '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent text-black font-semibold"
              onClick={() => openLeadForm('header_cta')}
            >
              Получить каталог
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/60 to-[#0a0a0a]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8">
          <Badge className="bg-accent/20 text-accent border-accent/40/30 px-4 py-1.5 text-xs">
            ПЕРВЫЕ В АЗИАТСКО-ТИХООКЕАНСКОМ РЕГИОНЕ
          </Badge>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            <span className="text-white">PEYLAA</span>{' '}
            <span className="text-accent">Phuket</span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl text-white/60 font-normal">
              Autograph Collection Residences
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            408 премиальных резиденций в Bang Tao. Бренд Marriott.
            {minPrice && (
              <span className="block mt-2 text-accent font-semibold">
                от {formatThb(minPrice)} (~${Math.round(minPrice / 35).toLocaleString()})
              </span>
            )}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {s.value}
                </div>
                <div className="text-xs text-white/50 mt-1">{s.label}</div>
              </div>
            ))}
            {totalAvailable > 0 && (
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-success" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {totalAvailable}
                </div>
                <div className="text-xs text-white/50 mt-1">В продаже</div>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent text-black font-bold text-base px-8"
              onClick={() => openLeadForm('hero_cta')}
            >
              Получить презентацию
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <a href="#units">
                Выбрать резиденцию
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 pt-6 text-xs text-white/40">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Marriott International</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> EIA одобрен</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Финансирование до 50%</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Полная отделка</span>
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Почему <span className="text-accent">PEYLAA</span>
          </h2>
          <p className="text-center text-white/50 mb-12 max-w-2xl mx-auto">
            Первый проект Autograph Collection Residences в Азиатско-Тихоокеанском регионе от Marriott International
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {KEY_FEATURES.map((f) => (
              <Card key={f.title} className="bg-white/5 border-white/10 hover:border-accent/40/30 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-none bg-accent/10 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY ── */}
      {gallery && gallery.length > 0 && (
        <section id="gallery" className="py-20 px-4 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-accent">Галерея</span> проекта
            </h2>
            <p className="text-center text-white/50 mb-10">
              Экстерьер, инфраструктура и интерьеры PEYLAA Phuket
            </p>

            {/* Masonry-like grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxIdx(idx)}
                  className={`relative group overflow-hidden rounded-none ${
                    item.is_hero ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title_ru || item.title}
                    loading="lazy"
                    className="w-full h-full object-cover aspect-[4/3] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-sm font-medium text-white">{item.title_ru || item.title}</div>
                    <div className="text-xs text-white/60 capitalize">{item.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightboxIdx !== null && (
            <div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
              onClick={() => setLightboxIdx(null)}
            >
              <button
                className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-10"
                onClick={() => setLightboxIdx(null)}
              >
                &times;
              </button>
              {lightboxIdx > 0 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                >
                  ‹
                </button>
              )}
              {lightboxIdx < gallery.length - 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                >
                  ›
                </button>
              )}
              <img
                src={gallery[lightboxIdx].url}
                alt={gallery[lightboxIdx].title_ru || gallery[lightboxIdx].title}
                className="max-w-full max-h-[90vh] object-contain rounded-none"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-6 text-center text-white">
                <div className="text-lg font-medium">{gallery[lightboxIdx].title_ru || gallery[lightboxIdx].title}</div>
                <div className="text-sm text-white/50">{lightboxIdx + 1} / {gallery.length}</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── UNIT TYPES ── */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Типы <span className="text-accent">резиденций</span>
          </h2>
          <p className="text-center text-white/50 mb-12">
            3 типа планировок от 45 до 129 м². Все с полной отделкой и мебелью.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                type: '1 Bedroom',
                area: '45 м²',
                priceFrom: stats?.find(s => s.bedrooms === 1)?.min_price,
                count: stats?.filter(s => s.bedrooms === 1).reduce((sum, s) => sum + s.available, 0) || 0,
                features: ['Спальня', 'Гостиная', 'Балкон', 'Ванная'],
              },
              {
                type: '2 Bedrooms',
                area: '83–86 м²',
                priceFrom: stats?.find(s => s.bedrooms === 2)?.min_price,
                count: stats?.filter(s => s.bedrooms === 2).reduce((sum, s) => sum + s.available, 0) || 0,
                features: ['2 спальни', 'Гостиная', 'Кухня', '2 балкона', '2 ванных'],
                popular: true,
              },
              {
                type: '3 Bedrooms',
                area: '129 м²',
                priceFrom: null,
                count: 0,
                features: ['3 спальни', 'Гостиная', 'Кухня', 'Терраса', '3 ванных'],
                comingSoon: true,
              },
            ].map((unit) => (
              <Card
                key={unit.type}
                className={`bg-white/5 border-white/10 relative overflow-hidden ${
                  unit.popular ? 'ring-1 ring-accent/50' : ''
                }`}
              >
                {unit.popular && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-accent text-black text-[10px]">ПОПУЛЯРНЫЙ</Badge>
                  </div>
                )}
                {unit.comingSoon && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="border-white/30 text-white/50 text-[10px]">BUILDING C</Badge>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {unit.type}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Maximize className="w-4 h-4" />
                      {unit.area}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {unit.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="w-3 h-3 text-accent flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    {unit.priceFrom ? (
                      <>
                        <div className="text-xs text-white/40">от</div>
                        <div className="text-2xl font-bold text-accent" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatThb(unit.priceFrom)}
                        </div>
                        <div className="text-xs text-white/40">
                          ~${Math.round(unit.priceFrom / 35).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="text-white/40 text-sm">Цена по запросу</div>
                    )}
                    {unit.count > 0 && (
                      <div className="text-xs text-success mt-2">{unit.count} доступно</div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-white/10 hover:bg-white/20 text-white"
                    asChild
                  >
                    <a href="#units">
                      Смотреть юниты
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIT CATALOG ── */}
      <section id="units" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Выберите <span className="text-accent">резиденцию</span>
          </h2>
          <p className="text-center text-white/50 mb-8">
            {totalAvailable} юнитов доступно. Актуальные цены от {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
          <PeylaaUnitCatalog onInquiry={(unitId) => {
            setLeadFormSource('unit_inquiry');
            setShowLeadForm(true);
          }} />
        </div>
      </section>

      {/* ── AMENITIES ── */}
      <section id="amenities" className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            <span className="text-accent">Инфраструктура</span> мирового уровня
          </h2>
          <p className="text-center text-white/50 mb-12">
            28 объектов инфраструктуры. Бассейны, фитнес, теннис, рестораны, консьерж-сервис.
          </p>

          {Object.entries(amenitiesByCategory).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h3 className="text-lg font-semibold text-white/80 mb-4 capitalize">
                {category === 'active_lifestyle' ? '🏊 Активный отдых' :
                 category === 'community' ? '👨‍👩‍👧‍👦 Сообщество' :
                 category === 'resident_services' ? '🛎 Резидентские услуги' :
                 '✨ Премиум'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items?.map((a) => (
                  <div
                    key={a.id}
                    className={`px-4 py-3 rounded-none border text-sm flex items-center gap-2 ${
                      a.is_phase2
                        ? 'bg-white/[0.02] border-white/5 text-white/40'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    <span>{a.name_ru}</span>
                    {a.is_phase2 && <Badge variant="outline" className="text-[9px] border-white/20 text-white/30 ml-auto">Phase 2</Badge>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROI CALCULATOR ── */}
      <section id="roi" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Калькулятор <span className="text-accent">доходности</span>
          </h2>
          <p className="text-center text-white/50 mb-8">
            Рассчитайте ROI от сдачи в аренду. Средняя доходность branded residences на Пхукете: 6–8% годовых.
          </p>
          <PeylaaROICalculator onGetConsultation={() => openLeadForm('roi_calculator')} />
        </div>
      </section>

      {/* ── PAYMENT TERMS ── */}
      <section id="payment" className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Условия <span className="text-accent">покупки</span>
          </h2>
          <p className="text-center text-white/50 mb-12">
            Для иностранных покупателей. Рассрочка привязана к этапам строительства.
          </p>

          <div className="space-y-3">
            {PAYMENT_STEPS_FOREIGN.map((s, i) => (
              <div
                key={s.step}
                className="flex items-center gap-4 p-4 rounded-none bg-white/5 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{s.step}</div>
                </div>
                <div className="text-right">
                  {s.pct && (
                    <div className="text-lg font-bold text-accent" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {s.pct}
                    </div>
                  )}
                  {s.amount && (
                    <div className="text-sm text-white/50">{s.amount}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Financing badge */}
          <Card className="mt-8 bg-accent/10 border-accent/40/20">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Landmark className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Финансирование для иностранцев</h3>
                <p className="text-white/50 text-sm mt-1">
                  Capital Link Credit Foncier — до 50% от стоимости, до 15 лет, ~9% годовых. Без предоплаты за оформление.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-accent/40/50 text-accent hover:bg-accent/10 whitespace-nowrap"
                onClick={() => openLeadForm('financing_inquiry')}
              >
                Узнать подробнее
              </Button>
            </CardContent>
          </Card>

          {/* Additional costs */}
          <div className="mt-8 p-6 rounded-none bg-white/5 border border-white/10">
            <h3 className="text-white font-semibold mb-4">Дополнительные расходы</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Sinking Fund (единоразово)</span>
                <span className="text-white font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿700/м²</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Обслуживание (1-й год)</span>
                <span className="text-white font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿120/м²/мес</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Обслуживание (2-й год)</span>
                <span className="text-white font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿135/м²/мес</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Сбор за трансфер</span>
                <span className="text-white font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>2% (50/50)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEVELOPER ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Девелопер
          </h2>
          <div className="space-y-4 text-white/60">
            <p className="text-lg">
              <span className="text-white font-semibold">Capstone Asset Phuket Cherngtalay Co., Ltd.</span>
            </p>
            <p>
              Руководитель проекта — <span className="text-white">Khun Titiwat Kuvijitsuwan</span>.
              Земельный участок 10.19 рай. Ипотека в Kasikornbank. EIA одобрен.
            </p>
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: 'Syne, sans-serif' }}>
            Локация: <span className="text-accent">Bang Tao</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Bang Tao Beach', dist: '1.5 км', icon: '🏖' },
              { label: 'Boat Avenue', dist: '500 м', icon: '🛍' },
              { label: 'Laguna Phuket', dist: '1 км', icon: '🌴' },
              { label: 'Аэропорт', dist: '20 мин', icon: '✈️' },
              { label: 'Central Phuket', dist: '25 мин', icon: '🏬' },
              { label: 'Patong', dist: '30 мин', icon: '🎉' },
              { label: 'British Int. School', dist: '5 мин', icon: '🎓' },
              { label: 'Bangkok Hospital', dist: '15 мин', icon: '🏥' },
            ].map(l => (
              <div key={l.label} className="p-4 rounded-none bg-white/5 border border-white/10 text-center">
                <div className="text-2xl mb-2">{l.icon}</div>
                <div className="text-sm text-white font-medium">{l.label}</div>
                <div className="text-xs text-accent mt-1">{l.dist}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            Готовы выбрать свою <span className="text-accent">резиденцию</span>?
          </h2>
          <p className="text-white/50 text-lg">
            Получите персональную подборку юнитов, расчёт доходности и условия финансирования
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent text-black font-bold text-base px-10"
              onClick={() => openLeadForm('final_cta')}
            >
              Получить консультацию
              <Phone className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.open('https://wa.me/66922407355?text=Здравствуйте! Хочу узнать о PEYLAA Phuket', '_blank')}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Написать в WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <div>PEYLAA Phuket, Autograph Collection Residences &copy; {new Date().getFullYear()}</div>
          <div>Продаётся через Ignatev Capital — myUNO Platform</div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/66922407355" className="hover:text-white/60">WhatsApp</a>
            <a href="https://t.me/peylaa_bot" className="hover:text-white/60">Telegram</a>
          </div>
        </div>
      </footer>

      {/* ── Lead Form Modal ── */}
      {showLeadForm && (
        <PeylaaLeadForm
          source={leadFormSource}
          utm={utm}
          onClose={() => setShowLeadForm(false)}
        />
      )}
    </div>
  );
}

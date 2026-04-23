import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Building2, Shield, CreditCard, Star, 
  CheckCircle, Scale, FileText, BadgeCheck, Crown,
  ArrowRight, MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function PartnerAgreementPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Условия партнёрства' : 'Partnership Terms'} 
          showBack 
        />

        {/* Hero Card */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-5 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 mb-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-bold text-lg mb-1">
              {isRu ? 'Прозрачные условия для партнёров' : 'Transparent Terms for Partners'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isRu 
                ? 'Мы зарабатываем только когда зарабатываете вы. Никаких скрытых платежей.'
                : 'We earn only when you earn. No hidden fees.'}
            </p>
          </CardContent>
        </Card>

        {/* 1. Как это работает */}
        <SectionTitle icon={Star} title={isRu ? 'Как это работает' : 'How It Works'} />
        <div className="space-y-2 mb-8">
          {[
            { emoji: '1️⃣', text: isRu ? 'Вы регистрируетесь и добавляете свои услуги — бесплатно' : 'Register and add your services — free' },
            { emoji: '2️⃣', text: isRu ? 'Клиенты находят вас на платформе и бронируют' : 'Clients find you on the platform and book' },
            { emoji: '3️⃣', text: isRu ? 'Вы оказываете услугу, мы переводим оплату каждую пятницу' : 'You deliver the service, we transfer payment every Friday' },
            { emoji: '4️⃣', text: isRu ? 'Платформа удерживает комиссию по правилам ниже' : 'Platform deducts commission according to the rules below' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-none border bg-card">
              <span className="text-lg">{item.emoji}</span>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        {/* 2. Комиссия */}
        <SectionTitle icon={CreditCard} title={isRu ? 'Комиссия и выплаты' : 'Commission & Payouts'} />
        <Card className="mb-8">
          <CardContent className="p-5 space-y-3">
            <ConditionRow 
              icon="💰" 
              text={isRu 
                ? 'Flat rate: 10% для всех сервисных вертикалей платформы.' 
                : 'Flat rate: 10% for all service verticals on the platform.'}
            />
            <ConditionRow 
              icon="🏠" 
              text={isRu 
                ? 'Исключения: продажа недвижимости — 5%; property management — модель 70/30 (не комиссия листинга).' 
                : 'Exceptions: property sale — 5%; property management — 70/30 model (not a listing commission).'}
            />
            <ConditionRow 
              icon="📅" 
              text={isRu ? 'Выплаты каждую пятницу. Минимальная сумма: ₿1,000.' : 'Payouts every Friday. Minimum amount: ₿1,000.'}
            />
            <ConditionRow 
              icon="🔒" 
              text={isRu 
                ? 'Escrow-защита: деньги хранятся на платформе до завершения услуги + 72 часа.' 
                : 'Escrow protection: funds held until service completion + 72 hours.'}
            />
            <ConditionRow 
              icon="🆓" 
              text={isRu ? 'Первый месяц — 0% комиссии для новых партнёров.' : 'First month — 0% commission for new partners.'}
            />
          </CardContent>
        </Card>

        {/* 3. Верификация */}
        <SectionTitle icon={Shield} title={isRu ? 'Уровни верификации' : 'Verification Levels'} />
        <div className="space-y-3 mb-8">
          <VerificationCard
            icon={BadgeCheck}
            level={isRu ? 'Базовый' : 'Basic'}
            color="text-muted-foreground"
            bg="bg-muted/50"
            desc={isRu ? 'Сразу после регистрации' : 'Right after registration'}
            perks={isRu 
              ? ['Профиль на платформе', 'Получение заказов']
              : ['Platform profile', 'Receive orders']}
          />
          <VerificationCard
            icon={Shield}
            level={isRu ? 'Проверенный' : 'Verified'}
            color="text-primary"
            bg="bg-primary/5"
            desc={isRu ? 'Документы + лицензия' : 'Documents + license'}
            perks={isRu 
              ? ['Значок ✓ Проверено', 'Приоритет в поиске', 'Защита G-Trust']
              : ['✓ Verified badge', 'Search priority', 'G-Trust protection']}
          />
          <VerificationCard
            icon={Crown}
            level={isRu ? 'Премиум' : 'Premium'}
            color="text-accent"
            bg="bg-accent/5"
            desc={isRu ? 'Рейтинг 4.5+ и 50+ заказов' : 'Rating 4.5+ & 50+ orders'}
            perks={isRu 
              ? ['Топ выдачи', 'Сниженная комиссия', 'Персональный менеджер']
              : ['Top ranking', 'Reduced commission', 'Personal manager']}
          />
        </div>

        {/* 4. Правила листинга */}
        <SectionTitle icon={FileText} title={isRu ? 'Правила листинга' : 'Listing Rules'} />
        <Card className="mb-8">
          <CardContent className="p-5 space-y-3">
            <ConditionRow icon="📸" text={isRu ? 'Минимум 3 реальные фотографии (стоковые изображения запрещены).' : 'Minimum 3 real photos (stock images are prohibited).'} />
            <ConditionRow icon="💱" text={isRu ? 'Цены должны быть актуальны и указаны в THB.' : 'Prices must be up to date and listed in THB.'} />
            <ConditionRow icon="🌐" text={isRu ? 'Описание листинга обязательно на двух языках: RU и EN.' : 'Listing description is required in two languages: RU and EN.'} />
            <ConditionRow icon="⏱" text={isRu ? 'Ответ на запрос клиента — в течение 2 часов.' : 'Reply to client requests within 2 hours.'} />
            <ConditionRow icon="⭐" text={isRu ? 'Минимальный рейтинг 4.0 для сохранения активного статуса.' : 'Minimum rating of 4.0 to keep active status.'} />
          </CardContent>
        </Card>

        {/* 5. Споры и расторжение */}
        <SectionTitle icon={Scale} title={isRu ? 'Споры и расторжение' : 'Disputes & Termination'} />
        <Card className="mb-8">
          <CardContent className="p-5 space-y-3">
            <ConditionRow 
              icon="⚖️" 
              text={isRu 
                ? 'При споре выплата замораживается до разрешения. myUNO — арбитр.' 
                : 'In disputes, payment is frozen until resolution. myUNO is the arbiter.'}
            />
            <ConditionRow 
              icon="🚪" 
              text={isRu 
                ? 'Вы можете уйти с уведомлением за 30 дней. Активные заказы выполняются.' 
                : 'You can leave with 30 days notice. Active orders must be fulfilled.'}
            />
            <ConditionRow 
              icon="🚫" 
              text={isRu 
                ? 'Грубые нарушения (мошенничество, обход платформы) — немедленное отключение.' 
                : 'Serious violations (fraud, platform bypass) — immediate disconnection.'}
            />
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-lg mb-2">
              {isRu ? 'Готовы начать?' : 'Ready to start?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Регистрация бесплатна и занимает 2 минуты.' 
                : 'Registration is free and takes 2 minutes.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link to="/vendor/join">
                  {isRu ? 'Стать партнёром' : 'Become a Partner'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:partners@myuno.app">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  partners@myuno.app
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}

// ── Helpers ──

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      {title}
    </h2>
  );
}

function ConditionRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function VerificationCard({ icon: Icon, level, color, bg, desc, perks }: {
  icon: any; level: string; color: string; bg: string; desc: string; perks: string[];
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('p-2 rounded-none', bg)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <div>
            <p className="font-bold text-sm">{level}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {perks.map((p, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
              <CheckCircle className="h-3 w-3 mr-1" />
              {p}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { SectionCard } from "@/components/uno/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, ShieldCheck, CheckCircle2, Lock, CreditCard, 
  Users, Building2, Briefcase, Star, Clock, Award,
  RefreshCcw, HeadphonesIcon, Eye, FileCheck, BadgeCheck,
  Wallet, Home, UserCheck, TrendingUp, MessageSquare,
  ArrowRight, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GTrustPage = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const mainGuarantees = [
    {
      icon: RefreshCcw,
      title: isRu ? "100% возврат средств" : "100% Money Back",
      description: isRu 
        ? "Полный возврат оплаты, если услуга не была оказана или не соответствует описанию"
        : "Full refund if the service was not provided or doesn't match the description",
      color: "text-green-600"
    },
    {
      icon: ShieldCheck,
      title: isRu ? "Защита от мошенничества" : "Fraud Protection",
      description: isRu 
        ? "Все платежи защищены. Средства переводятся исполнителю только после подтверждения оказания услуги"
        : "All payments are protected. Funds are released to providers only after service confirmation",
      color: "text-blue-600"
    },
    {
      icon: HeadphonesIcon,
      title: isRu ? "Поддержка 24/7" : "24/7 Support",
      description: isRu 
        ? "Круглосуточная поддержка на русском, английском и тайском языках"
        : "Round-the-clock support in Russian, English, and Thai",
      color: "text-purple-600"
    },
    {
      icon: Eye,
      title: isRu ? "Прозрачные цены" : "Transparent Pricing",
      description: isRu 
        ? "Никаких скрытых комиссий. Цена, которую вы видите — это финальная цена"
        : "No hidden fees. The price you see is the final price",
      color: "text-amber-600"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: FileCheck,
      title: isRu ? "Проверка партнёра" : "Partner Verification",
      description: isRu 
        ? "Мы проверяем документы, лицензии, страховку и историю каждого партнёра перед допуском на платформу"
        : "We verify documents, licenses, insurance, and history of each partner before platform access"
    },
    {
      step: 2,
      icon: Lock,
      title: isRu ? "Безопасная оплата" : "Secure Payment",
      description: isRu 
        ? "Ваши деньги хранятся на защищённом счёте (escrow) до момента оказания услуги"
        : "Your money is held in a protected escrow account until the service is delivered"
    },
    {
      step: 3,
      icon: Star,
      title: isRu ? "Контроль качества" : "Quality Control",
      description: isRu 
        ? "Мы мониторим отзывы и оперативно реагируем на любые жалобы клиентов"
        : "We monitor reviews and respond promptly to any customer complaints"
    },
    {
      step: 4,
      icon: RefreshCcw,
      title: isRu ? "Гарантия возврата" : "Refund Guarantee",
      description: isRu 
        ? "При любом споре мы встаём на сторону клиента и гарантируем возврат средств"
        : "In any dispute, we side with the customer and guarantee a refund"
    }
  ];

  const guestGuarantees = [
    {
      icon: RefreshCcw,
      title: isRu ? "100% возврат" : "100% Refund",
      description: isRu ? "При неоказании услуги" : "If service not provided"
    },
    {
      icon: ShieldCheck,
      title: isRu ? "Защита платежей" : "Payment Protection",
      description: isRu ? "Безопасные транзакции" : "Secure transactions"
    },
    {
      icon: BadgeCheck,
      title: isRu ? "Верифицированные партнёры" : "Verified Partners",
      description: isRu ? "Все проверены" : "All verified"
    },
    {
      icon: HeadphonesIcon,
      title: isRu ? "Поддержка 24/7" : "24/7 Support",
      description: isRu ? "Всегда на связи" : "Always available"
    },
    {
      icon: Eye,
      title: isRu ? "Честные цены" : "Fair Prices",
      description: isRu ? "Без скрытых комиссий" : "No hidden fees"
    },
    {
      icon: MessageSquare,
      title: isRu ? "Реальные отзывы" : "Real Reviews",
      description: isRu ? "Только от клиентов" : "From real customers"
    }
  ];

  const ownerGuarantees = [
    {
      icon: UserCheck,
      title: isRu ? "Проверенные гости" : "Verified Guests",
      description: isRu ? "Верификация всех арендаторов через паспорт и контактные данные" : "Verification of all tenants via passport and contact details"
    },
    {
      icon: Shield,
      title: isRu ? "Защита имущества" : "Property Protection",
      description: isRu ? "Страхование от повреждений до $10,000" : "Damage insurance up to $10,000"
    },
    {
      icon: Wallet,
      title: isRu ? "Гарантированные выплаты" : "Guaranteed Payouts",
      description: isRu ? "Выплаты в течение 24 часов после заезда гостя" : "Payouts within 24 hours after guest check-in"
    },
    {
      icon: Clock,
      title: isRu ? "Быстрое решение споров" : "Fast Dispute Resolution",
      description: isRu ? "Решение любых конфликтов в течение 48 часов" : "Resolution of any conflicts within 48 hours"
    }
  ];

  const vendorGuarantees = [
    {
      icon: CreditCard,
      title: isRu ? "Гарантированные платежи" : "Guaranteed Payments",
      description: isRu ? "Выплаты по расписанию, без задержек" : "Scheduled payouts, no delays"
    },
    {
      icon: Shield,
      title: isRu ? "Защита от отмен" : "Cancellation Protection",
      description: isRu ? "Компенсация при отмене бронирования менее чем за 24 часа" : "Compensation for cancellations less than 24 hours in advance"
    },
    {
      icon: Star,
      title: isRu ? "Честная модерация" : "Fair Moderation",
      description: isRu ? "Проверка всех отзывов на достоверность" : "Verification of all reviews for authenticity"
    },
    {
      icon: TrendingUp,
      title: isRu ? "Маркетинговая поддержка" : "Marketing Support",
      description: isRu ? "Продвижение верифицированных партнёров" : "Promotion of verified partners"
    }
  ];

  const verificationLevels = [
    {
      level: isRu ? "Базовая" : "Basic",
      icon: CheckCircle2,
      color: "bg-blue-500",
      requirements: isRu 
        ? ["Регистрация бизнеса", "Контактные данные", "Базовая проверка"] 
        : ["Business registration", "Contact details", "Basic check"]
    },
    {
      level: isRu ? "Расширенная" : "Extended",
      icon: ShieldCheck,
      color: "bg-green-500",
      requirements: isRu 
        ? ["Лицензии и разрешения", "Страхование", "История работы 1+ год"] 
        : ["Licenses and permits", "Insurance", "1+ year work history"]
    },
    {
      level: isRu ? "Премиум" : "Premium",
      icon: Award,
      color: "bg-amber-500",
      requirements: isRu 
        ? ["Физическая инспекция", "Финансовая проверка", "Рейтинг 4.5+ звёзд"] 
        : ["Physical inspection", "Financial verification", "4.5+ star rating"]
    }
  ];

  const trustScoreCriteria = [
    { label: isRu ? "Отзывы клиентов" : "Customer Reviews", weight: "30%" },
    { label: isRu ? "Повторные заказы" : "Repeat Orders", weight: "25%" },
    { label: isRu ? "Время отклика" : "Response Time", weight: "15%" },
    { label: isRu ? "Выполненные заказы" : "Completed Orders", weight: "20%" },
    { label: isRu ? "Срок на платформе" : "Platform Tenure", weight: "10%" }
  ];

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>, title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-primary" />
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
  );

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        <PageHeader 
          title={isRu ? "G-Trust Гарантии" : "G-Trust Guarantees"}
          showBack
        />

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 md:p-8 text-white mb-6"
        >
          <div className="absolute top-0 right-0 opacity-10">
            <Shield className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">G-Trust</h1>
                <p className="text-white/80 text-sm">by myUNO</p>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">
              {isRu ? "100% Защита ваших покупок" : "100% Protection for Your Purchases"}
            </h2>
            <p className="text-white/90 text-sm md:text-base max-w-lg">
              {isRu 
                ? "Система гарантий myUNO защищает каждую транзакцию. Мы гарантируем полный возврат средств, если услуга не была оказана."
                : "myUNO's guarantee system protects every transaction. We guarantee a full refund if the service was not provided."}
            </p>
          </div>
        </motion.div>

        {/* Main Guarantees */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Shield} title={isRu ? "Главные гарантии" : "Main Guarantees"} />
          <div className="grid gap-4">
            {mainGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 rounded-xl bg-muted/50 border"
              >
                <div className={`p-3 rounded-xl bg-background ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* How G-Trust Works */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Sparkles} title={isRu ? "Как работает G-Trust" : "How G-Trust Works"} />
          <div className="space-y-4">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-4 items-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div className="flex-1 pb-4 border-b last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Guests & Buyers */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Users} title={isRu ? "Для гостей и покупателей" : "For Guests & Buyers"} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {guestGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center"
              >
                <item.icon className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Property Owners */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Home} title={isRu ? "Для владельцев недвижимости" : "For Property Owners"} />
          <div className="grid gap-3">
            {ownerGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <item.icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* For Vendors & Partners */}
        <SectionCard className="mb-6">
          <SectionHeader icon={Briefcase} title={isRu ? "Для поставщиков и партнёров" : "For Vendors & Partners"} />
          <div className="grid gap-3">
            {vendorGuarantees.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <item.icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Verification Levels */}
        <SectionCard className="mb-6">
          <SectionHeader icon={BadgeCheck} title={isRu ? "Уровни верификации" : "Verification Levels"} />
          <div className="grid md:grid-cols-3 gap-4">
            {verificationLevels.map((level, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="p-4 rounded-xl border bg-card"
              >
                <div className={`w-12 h-12 ${level.color} rounded-full flex items-center justify-center mb-3`}>
                  <level.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold mb-2">{level.level}</h4>
                <ul className="space-y-1">
                  {level.requirements.map((req, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Trust Score */}
        <SectionCard className="mb-6">
          <SectionHeader icon={TrendingUp} title={isRu ? "Trust Score — Индекс доверия" : "Trust Score — Trust Index"} />
          <p className="text-sm text-muted-foreground mb-4">
            {isRu 
              ? "Каждый партнёр на платформе имеет Trust Score от 0 до 100%. Чем выше показатель, тем надёжнее партнёр."
              : "Every partner on the platform has a Trust Score from 0 to 100%. The higher the score, the more reliable the partner."}
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-lg font-bold text-green-600">90-100%</div>
              <div className="text-xs text-muted-foreground">{isRu ? "Превосходно" : "Excellent"}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-lg font-bold text-blue-600">75-89%</div>
              <div className="text-xs text-muted-foreground">{isRu ? "Очень хорошо" : "Very Good"}</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-lg font-bold text-amber-600">60-74%</div>
              <div className="text-xs text-muted-foreground">{isRu ? "Хорошо" : "Good"}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
              <div className="text-lg font-bold text-gray-600">&lt;60%</div>
              <div className="text-xs text-muted-foreground">{isRu ? "Новый партнёр" : "New Partner"}</div>
            </div>
          </div>

          <h4 className="font-medium text-sm mb-2">{isRu ? "Как рассчитывается:" : "How it's calculated:"}</h4>
          <div className="space-y-2">
            {trustScoreCriteria.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <Badge variant="secondary">{item.weight}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CTA Section */}
        <div className="space-y-3">
          <Link to="/support">
            <Button className="w-full" size="lg">
              <HeadphonesIcon className="w-4 h-4 mr-2" />
              {isRu ? "Связаться с поддержкой" : "Contact Support"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/refund-policy">
            <Button variant="outline" className="w-full" size="lg">
              <RefreshCcw className="w-4 h-4 mr-2" />
              {isRu ? "Политика возврата" : "Refund Policy"}
            </Button>
          </Link>
          <Link to="/become-partner">
            <Button variant="ghost" className="w-full" size="lg">
              <Briefcase className="w-4 h-4 mr-2" />
              {isRu ? "Стать партнёром G-Trust" : "Become a G-Trust Partner"}
            </Button>
          </Link>
        </div>
      </PageContainer>
    </AppLayout>
  );
};

export default GTrustPage;

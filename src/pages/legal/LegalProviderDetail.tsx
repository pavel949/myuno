import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  CheckCircle2,
  Languages,
  Award,
  FileText,
  MessageCircle,
  Calendar,
  Building2,
  Users,
  Shield
} from "lucide-react";

const LegalProviderDetail = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Demo provider data
  const provider = {
    id: id,
    name: "Phuket Legal Partners",
    category: language === "ru" ? "Юридические услуги" : "Legal Services",
    rating: 4.9,
    reviews: 87,
    experience: language === "ru" ? "15 лет на Пхукете" : "15 years in Phuket",
    description: language === "ru" 
      ? "Ведущая юридическая фирма на Пхукете, специализирующаяся на обслуживании иностранных клиентов. Мы помогаем с регистрацией бизнеса, сделками с недвижимостью, визовыми вопросами и трудовым правом."
      : "Leading law firm in Phuket specializing in serving foreign clients. We help with business registration, real estate transactions, visa matters, and employment law.",
    address: language === "ru" ? "123/45 Thaweewong Road, Патонг, Пхукет 83150" : "123/45 Thaweewong Road, Patong, Phuket 83150",
    phone: "+66 76 123 456",
    email: "info@phuketlegal.com",
    website: "www.phuketlegal.com",
    workingHours: language === "ru" ? "Пн-Пт: 9:00-18:00, Сб: 9:00-13:00" : "Mon-Fri: 9:00-18:00, Sat: 9:00-13:00",
    verified: true,
    languages: ["English", "Thai", "Russian", "Chinese"],
    licenses: [
      language === "ru" ? "Лицензия адвоката Таиланда #12345" : "Thai Bar License #12345",
      language === "ru" ? "Член Ассоциации адвокатов Пхукета" : "Phuket Bar Association Member",
    ],
    teamSize: 12,
    foundedYear: 2009,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop",
    services: [
      {
        name: language === "ru" ? "Регистрация компании" : "Company Registration",
        price: 35000,
        description: language === "ru" ? "Полное сопровождение регистрации Thai Co. Ltd" : "Full support for Thai Co. Ltd registration",
      },
      {
        name: language === "ru" ? "Сопровождение сделок с недвижимостью" : "Real Estate Transaction",
        price: 25000,
        description: language === "ru" ? "Проверка документов, составление договоров" : "Document verification, contract drafting",
      },
      {
        name: language === "ru" ? "Визовая консультация" : "Visa Consultation",
        price: 5000,
        description: language === "ru" ? "Консультация по типам виз и требованиям" : "Consultation on visa types and requirements",
      },
      {
        name: language === "ru" ? "Трудовое право" : "Employment Law",
        price: 8000,
        description: language === "ru" ? "Контракты, увольнения, споры" : "Contracts, terminations, disputes",
      },
      {
        name: language === "ru" ? "Due Diligence" : "Due Diligence",
        price: 50000,
        description: language === "ru" ? "Полная проверка компании перед покупкой" : "Complete company check before acquisition",
      },
    ],
    recentReviews: [
      {
        author: "Michael S.",
        rating: 5,
        date: "2024-01-10",
        text: language === "ru" 
          ? "Отличная команда! Помогли с регистрацией компании и work permit. Всё прошло гладко."
          : "Great team! Helped with company registration and work permit. Everything went smoothly.",
      },
      {
        author: "Anna K.",
        rating: 5,
        date: "2024-01-05",
        text: language === "ru"
          ? "Профессионально и быстро решили вопрос с визой. Рекомендую!"
          : "Professionally and quickly resolved visa issue. Highly recommend!",
      },
    ],
  };

  return (
    <AppLayout title={provider.name} showBottomNav={false}>
      <div className="pb-24">
        {/* Hero Image */}
        <div className="relative h-48">
          <img
            src={provider.image}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{provider.name}</h1>
              {provider.verified && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{provider.category}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{provider.rating}</span>
                <span className="text-sm text-muted-foreground">({provider.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{provider.experience}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {provider.languages.slice(0, 3).map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang.slice(0, 2).toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="px-4 pt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="about">{language === "ru" ? "О нас" : "About"}</TabsTrigger>
            <TabsTrigger value="services">{language === "ru" ? "Услуги" : "Services"}</TabsTrigger>
            <TabsTrigger value="reviews">{language === "ru" ? "Отзывы" : "Reviews"}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            </div>

            {/* Quick Info */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "ru" ? "Основана" : "Founded"}</p>
                    <p className="text-sm font-medium">{provider.foundedYear}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "ru" ? "Команда" : "Team"}</p>
                    <p className="text-sm font-medium">{provider.teamSize} {language === "ru" ? "специалистов" : "specialists"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold">{language === "ru" ? "Контакты" : "Contact"}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.website}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.workingHours}</span>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{language === "ru" ? "Языки" : "Languages"}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {provider.languages.map((lang) => (
                  <Badge key={lang} variant="outline">{lang}</Badge>
                ))}
              </div>
            </div>

            {/* Licenses */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{language === "ru" ? "Лицензии" : "Licenses"}</h3>
              </div>
              <div className="space-y-2">
                {provider.licenses.map((license, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>{license}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-3 mt-4">
            {provider.services.map((service, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">฿{service.price.toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => navigate(`/legal/booking/${id}?service=${encodeURIComponent(service.name)}`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {language === "ru" ? "Записаться" : "Book Consultation"}
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-3 mt-4">
            {/* Rating Summary */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{provider.rating}</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(provider.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{provider.reviews} {language === "ru" ? "отзывов" : "reviews"}</p>
              </div>
            </div>

            {/* Reviews List */}
            {provider.recentReviews.map((review, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{review.author[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${provider.phone}`)}>
              <Phone className="w-4 h-4 mr-2" />
              {language === "ru" ? "Позвонить" : "Call"}
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/legal/booking/${id}`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {language === "ru" ? "Записаться" : "Book"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LegalProviderDetail;

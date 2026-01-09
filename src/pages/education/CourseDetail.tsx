import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Calendar, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/uno/FavoriteButton";

const courses: Record<string, any> = {
  "1": {
    id: "1",
    title_en: "English for Kids",
    title_ru: "Английский для детей",
    description_en: "Fun and interactive English lessons for children 5-12 years. Our experienced teachers use games, songs and activities to make learning exciting and effective.",
    description_ru: "Веселые интерактивные уроки английского для детей 5-12 лет. Наши опытные преподаватели используют игры, песни и активности, чтобы сделать обучение увлекательным и эффективным.",
    images: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800"
    ],
    price: 150,
    currency: "฿",
    duration: "1 час",
    category: "languages",
    age_group: "kids",
    rating: 4.9,
    reviews: 128,
    location: "Patong, Phuket",
    address: "123 Beach Road, Patong",
    schedule: "Пн, Ср, Пт - 10:00",
    group_size: "5-8 детей",
    levels: ["Beginner", "Elementary", "Pre-Intermediate"],
    included: [
      { en: "All learning materials", ru: "Все учебные материалы" },
      { en: "Interactive workbooks", ru: "Интерактивные рабочие тетради" },
      { en: "Progress reports", ru: "Отчеты о прогрессе" },
      { en: "Certificate upon completion", ru: "Сертификат по окончании" }
    ],
    program: [
      { en: "Basic vocabulary and phrases", ru: "Базовая лексика и фразы" },
      { en: "Speaking and listening practice", ru: "Практика говорения и аудирования" },
      { en: "Reading simple texts", ru: "Чтение простых текстов" },
      { en: "Fun games and activities", ru: "Веселые игры и активности" }
    ],
    teacher: {
      name: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      experience: "10+ years"
    }
  },
  "2": {
    id: "2",
    title_en: "Thai Language Course",
    title_ru: "Курс тайского языка",
    description_en: "Learn Thai from native speakers, from beginner to advanced level. Master reading, writing, speaking and understanding Thai culture.",
    description_ru: "Изучайте тайский с носителями языка, от начального до продвинутого уровня. Освойте чтение, письмо, говорение и понимание тайской культуры.",
    images: [
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
    ],
    price: 200,
    currency: "฿",
    duration: "1.5 часа",
    category: "languages",
    age_group: "adults",
    rating: 4.8,
    reviews: 95,
    location: "Kata, Phuket",
    address: "45 Kata Road, Kata Beach",
    schedule: "Вт, Чт - 18:00",
    group_size: "4-6 человек",
    levels: ["Beginner", "Intermediate", "Advanced"],
    included: [
      { en: "Thai alphabet workbook", ru: "Рабочая тетрадь по тайскому алфавиту" },
      { en: "Audio materials", ru: "Аудио материалы" },
      { en: "Cultural insights", ru: "Культурные особенности" },
      { en: "Practice with natives", ru: "Практика с носителями" }
    ],
    program: [
      { en: "Thai alphabet and tones", ru: "Тайский алфавит и тоны" },
      { en: "Everyday conversations", ru: "Повседневные разговоры" },
      { en: "Reading Thai signs and menus", ru: "Чтение тайских вывесок и меню" },
      { en: "Thai culture and etiquette", ru: "Тайская культура и этикет" }
    ],
    teacher: {
      name: "Somchai Wongsa",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      experience: "15+ years"
    }
  }
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const course = courses[id || "1"] || courses["1"];

  const handleToggleFavorite = () => {
    toggleFavorite('course', course.id, {
      title_en: course.title_en,
      title_ru: course.title_ru,
      images: course.images,
      price: course.price,
      currency: course.currency,
      category: course.category,
      rating: course.rating
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={course.images[0]}
          alt={language === "ru" ? course.title_ru : course.title_en}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute top-4 right-4 flex gap-2">
          <FavoriteButton
            isFavorite={isFavorite('course', course.id)}
            onClick={handleToggleFavorite}
          />
          <Badge className={`${course.age_group === "kids" ? "bg-pink-500" : "bg-blue-500"}`}>
            {course.age_group === "kids" 
              ? (language === "ru" ? "Для детей" : "For Kids")
              : (language === "ru" ? "Для взрослых" : "For Adults")}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 relative">
        <div className="bg-card rounded-xl shadow-lg p-4">
          <h1 className="text-2xl font-bold text-foreground">
            {language === "ru" ? course.title_ru : course.title_en}
          </h1>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating}</span>
              <span>({course.reviews} {language === "ru" ? "отзывов" : "reviews"})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{course.address}</span>
          </div>
        </div>

        {/* Gallery */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {course.images.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              alt=""
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-card rounded-xl p-3 shadow-sm">
            <Calendar className="h-5 w-5 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">{language === "ru" ? "Расписание" : "Schedule"}</p>
            <p className="font-medium text-foreground text-sm">{course.schedule}</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-sm">
            <Users className="h-5 w-5 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">{language === "ru" ? "Группа" : "Group Size"}</p>
            <p className="font-medium text-foreground text-sm">{course.group_size}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {language === "ru" ? "О курсе" : "About Course"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ru" ? course.description_ru : course.description_en}
          </p>
        </div>

        {/* Levels */}
        <div className="mt-4">
          <h3 className="font-medium text-foreground mb-2">{language === "ru" ? "Уровни" : "Levels"}</h3>
          <div className="flex flex-wrap gap-2">
            {course.levels.map((level: string) => (
              <Badge key={level} variant="secondary">{level}</Badge>
            ))}
          </div>
        </div>

        {/* Program */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {language === "ru" ? "Программа" : "Program"}
          </h2>
          <div className="space-y-2">
            {course.program.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{language === "ru" ? item.ru : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Included */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {language === "ru" ? "Включено" : "Included"}
          </h2>
          <div className="space-y-2">
            {course.included.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{language === "ru" ? item.ru : item.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {language === "ru" ? "Преподаватель" : "Teacher"}
          </h2>
          <div className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-sm">
            <img
              src={course.teacher.image}
              alt={course.teacher.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-foreground">{course.teacher.name}</p>
              <p className="text-sm text-muted-foreground">
                {language === "ru" ? "Опыт" : "Experience"}: {course.teacher.experience}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{language === "ru" ? "Цена за занятие" : "Price per lesson"}</p>
          <p className="text-2xl font-bold text-primary">{course.currency}{course.price}</p>
        </div>
        <Button 
          size="lg"
          onClick={() => navigate(`/education/booking/course-${course.id}`)}
          className="px-8"
        >
          {language === "ru" ? "Записаться" : "Enroll"}
        </Button>
      </div>
    </div>
  );
}

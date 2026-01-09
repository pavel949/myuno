import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, MessageCircle, Award, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

const tutors: Record<string, any> = {
  "t1": {
    id: "t1",
    name: "Sarah Johnson",
    specialty_en: "English Teacher",
    specialty_ru: "Преподаватель английского",
    description_en: "Native English speaker from the UK with over 10 years of teaching experience. Specialized in preparing students for IELTS, TOEFL and Cambridge exams. I make learning fun and effective using modern teaching methods.",
    description_ru: "Носитель английского языка из Великобритании с более чем 10-летним опытом преподавания. Специализируюсь на подготовке студентов к IELTS, TOEFL и Кембриджским экзаменам. Делаю обучение веселым и эффективным, используя современные методы.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
    price: 500,
    currency: "฿",
    subjects: ["English", "IELTS", "TOEFL", "Business English", "Conversational English"],
    age_groups: ["kids", "adults"],
    rating: 4.9,
    reviews: 156,
    location: "Patong, Phuket",
    experience: "10+ years",
    students: 500,
    lessons: 3000,
    languages: ["English", "Thai (basic)"],
    education: [
      { en: "MA in Applied Linguistics, University of Cambridge", ru: "Магистр прикладной лингвистики, Кембриджский университет" },
      { en: "CELTA Certificate", ru: "Сертификат CELTA" }
    ],
    reviews_list: [
      { name: "Anna M.", rating: 5, text_en: "Amazing teacher! My IELTS score improved from 5.5 to 7.5", text_ru: "Потрясающий учитель! Мой балл IELTS вырос с 5.5 до 7.5" },
      { name: "Alex K.", rating: 5, text_en: "Very patient and professional. Highly recommend!", text_ru: "Очень терпеливая и профессиональная. Рекомендую!" }
    ]
  },
  "t2": {
    id: "t2",
    name: "Somchai Wongsa",
    specialty_en: "Thai Language Expert",
    specialty_ru: "Эксперт тайского языка",
    description_en: "Professional Thai teacher for foreigners with 15 years of experience. I help expats and tourists master Thai language and understand Thai culture. From basic survival Thai to business level.",
    description_ru: "Профессиональный преподаватель тайского для иностранцев с 15-летним опытом. Помогаю экспатам и туристам освоить тайский язык и понять тайскую культуру. От базового разговорного до делового уровня.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    price: 400,
    currency: "฿",
    subjects: ["Thai", "Thai Culture", "Thai Writing", "Business Thai"],
    age_groups: ["adults"],
    rating: 4.8,
    reviews: 98,
    location: "Phuket Town",
    experience: "15+ years",
    students: 800,
    lessons: 5000,
    languages: ["Thai", "English", "Chinese (basic)"],
    education: [
      { en: "BA in Thai Language, Chulalongkorn University", ru: "Бакалавр тайского языка, Университет Чулалонгкорн" },
      { en: "Certificate in Teaching Thai as Foreign Language", ru: "Сертификат преподавания тайского как иностранного" }
    ],
    reviews_list: [
      { name: "John D.", rating: 5, text_en: "Best Thai teacher in Phuket! Now I can read menus and signs", text_ru: "Лучший учитель тайского на Пхукете! Теперь я могу читать меню и вывески" },
      { name: "Maria S.", rating: 4, text_en: "Very patient, explains tones very well", text_ru: "Очень терпеливый, отлично объясняет тоны" }
    ]
  },
  "t3": {
    id: "t3",
    name: "Maria Petrova",
    specialty_en: "Math & Physics Tutor",
    specialty_ru: "Репетитор по математике и физике",
    description_en: "PhD in Physics with extensive experience preparing students for IB, A-Levels and university entrance exams. I specialize in making complex concepts easy to understand.",
    description_ru: "Кандидат физико-математических наук с обширным опытом подготовки студентов к IB, A-Levels и вступительным экзаменам в университеты. Специализируюсь на том, чтобы делать сложные концепции понятными.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800",
    price: 600,
    currency: "฿",
    subjects: ["Math", "Physics", "IB Math", "A-Level Physics", "SAT Math"],
    age_groups: ["kids", "adults"],
    rating: 5.0,
    reviews: 87,
    location: "Online / Kata",
    experience: "12+ years",
    students: 300,
    lessons: 4000,
    languages: ["Russian", "English", "Thai (basic)"],
    education: [
      { en: "PhD in Physics, Moscow State University", ru: "Кандидат физ.-мат. наук, МГУ" },
      { en: "IB Certified Examiner", ru: "Сертифицированный экзаменатор IB" }
    ],
    reviews_list: [
      { name: "Denis K.", rating: 5, text_en: "Got into MIT thanks to Maria's preparation!", text_ru: "Поступил в MIT благодаря подготовке с Марией!" },
      { name: "Lisa W.", rating: 5, text_en: "Finally understood calculus after years of struggling", text_ru: "Наконец поняла матанализ после многих лет борьбы" }
    ]
  },
  "t4": {
    id: "t4",
    name: "John Smith",
    specialty_en: "Music Teacher",
    specialty_ru: "Преподаватель музыки",
    description_en: "Professional musician and teacher with 8 years of experience. I teach guitar, piano and ukulele for all ages and levels. From complete beginners to advanced players.",
    description_ru: "Профессиональный музыкант и преподаватель с 8-летним опытом. Обучаю игре на гитаре, фортепиано и укулеле для всех возрастов и уровней. От полных новичков до продвинутых.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800",
    price: 450,
    currency: "฿",
    subjects: ["Guitar", "Piano", "Ukulele", "Music Theory", "Songwriting"],
    age_groups: ["kids", "adults"],
    rating: 4.7,
    reviews: 64,
    location: "Rawai, Phuket",
    experience: "8+ years",
    students: 200,
    lessons: 2000,
    languages: ["English", "Thai (conversational)"],
    education: [
      { en: "BA in Music, Berklee College of Music", ru: "Бакалавр музыки, Berklee College of Music" },
      { en: "Grade 8 ABRSM Piano & Guitar", ru: "8 ступень ABRSM Фортепиано и Гитара" }
    ],
    reviews_list: [
      { name: "Tom B.", rating: 5, text_en: "My son loves his guitar lessons with John!", text_ru: "Мой сын обожает уроки гитары с Джоном!" },
      { name: "Kate L.", rating: 4, text_en: "Patient teacher, fun lessons", text_ru: "Терпеливый учитель, веселые уроки" }
    ]
  }
};

export default function TutorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const tutor = tutors[id || "t1"] || tutors["t1"];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 pt-4 pb-24">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16">
        <div className="bg-card rounded-xl shadow-lg p-4 text-center">
          <img
            src={tutor.image}
            alt={tutor.name}
            className="w-24 h-24 rounded-full object-cover mx-auto -mt-16 border-4 border-card"
          />
          <h1 className="text-xl font-bold text-foreground mt-2">{tutor.name}</h1>
          <p className="text-primary font-medium">
            {language === "ru" ? tutor.specialty_ru : tutor.specialty_en}
          </p>
          
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{tutor.rating}</span>
            <span className="text-muted-foreground">({tutor.reviews} {language === "ru" ? "отзывов" : "reviews"})</span>
          </div>

          <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tutor.location}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-muted rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{tutor.experience}</p>
              <p className="text-xs text-muted-foreground">{language === "ru" ? "Опыт" : "Experience"}</p>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{tutor.students}+</p>
              <p className="text-xs text-muted-foreground">{language === "ru" ? "Учеников" : "Students"}</p>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <p className="text-lg font-bold text-foreground">{tutor.lessons}+</p>
              <p className="text-xs text-muted-foreground">{language === "ru" ? "Уроков" : "Lessons"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {language === "ru" ? "Предметы" : "Subjects"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tutor.subjects.map((subject: string) => (
            <Badge key={subject} variant="secondary">{subject}</Badge>
          ))}
        </div>
      </div>

      {/* Age Groups */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-5 w-5" />
          {language === "ru" ? "Возраст учеников" : "Student Ages"}
        </h2>
        <div className="flex gap-2">
          {tutor.age_groups.includes("kids") && (
            <Badge className="bg-pink-100 text-pink-600 hover:bg-pink-100">
              {language === "ru" ? "Дети" : "Kids"}
            </Badge>
          )}
          {tutor.age_groups.includes("adults") && (
            <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">
              {language === "ru" ? "Взрослые" : "Adults"}
            </Badge>
          )}
        </div>
      </div>

      {/* About */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {language === "ru" ? "О репетиторе" : "About Tutor"}
        </h2>
        <p className="text-muted-foreground">
          {language === "ru" ? tutor.description_ru : tutor.description_en}
        </p>
      </div>

      {/* Education */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Award className="h-5 w-5" />
          {language === "ru" ? "Образование" : "Education"}
        </h2>
        <div className="space-y-2">
          {tutor.education.map((edu: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <span className="text-foreground">{language === "ru" ? edu.ru : edu.en}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {language === "ru" ? "Языки преподавания" : "Teaching Languages"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tutor.languages.map((lang: string) => (
            <Badge key={lang} variant="outline">{lang}</Badge>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {language === "ru" ? "Отзывы" : "Reviews"}
        </h2>
        <div className="space-y-3">
          {tutor.reviews_list.map((review: any, idx: number) => (
            <div key={idx} className="bg-card rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{review.name}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ru" ? review.text_ru : review.text_en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{language === "ru" ? "Цена за час" : "Price per hour"}</p>
          <p className="text-2xl font-bold text-primary">{tutor.currency}{tutor.price}</p>
        </div>
        <Button 
          size="lg"
          onClick={() => navigate(`/education/booking/tutor-${tutor.id}`)}
          className="px-8"
        >
          {language === "ru" ? "Записаться" : "Book Lesson"}
        </Button>
      </div>
    </div>
  );
}

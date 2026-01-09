import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, GraduationCap, BookOpen, Users, Baby, User, Star, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const courses = [
  {
    id: "1",
    title_en: "English for Kids",
    title_ru: "Английский для детей",
    description_en: "Fun and interactive English lessons for children 5-12 years",
    description_ru: "Веселые интерактивные уроки английского для детей 5-12 лет",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    price: 150,
    currency: "฿",
    duration: "1 час",
    category: "languages",
    age_group: "kids",
    rating: 4.9,
    reviews: 128,
    location: "Patong, Phuket",
    schedule: "Пн, Ср, Пт - 10:00"
  },
  {
    id: "2",
    title_en: "Thai Language Course",
    title_ru: "Курс тайского языка",
    description_en: "Learn Thai from native speakers, beginner to advanced",
    description_ru: "Изучайте тайский с носителями языка, от начального до продвинутого",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
    price: 200,
    currency: "฿",
    duration: "1.5 часа",
    category: "languages",
    age_group: "adults",
    rating: 4.8,
    reviews: 95,
    location: "Kata, Phuket",
    schedule: "Вт, Чт - 18:00"
  },
  {
    id: "3",
    title_en: "Art & Creativity for Kids",
    title_ru: "Творчество для детей",
    description_en: "Drawing, painting and crafts for children 4-10 years",
    description_ru: "Рисование, живопись и поделки для детей 4-10 лет",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
    price: 120,
    currency: "฿",
    duration: "1.5 часа",
    category: "creative",
    age_group: "kids",
    rating: 4.9,
    reviews: 76,
    location: "Rawai, Phuket",
    schedule: "Сб, Вс - 10:00"
  },
  {
    id: "4",
    title_en: "Programming for Beginners",
    title_ru: "Программирование для начинающих",
    description_en: "Learn Python and web development basics",
    description_ru: "Изучите основы Python и веб-разработки",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
    price: 300,
    currency: "฿",
    duration: "2 часа",
    category: "technology",
    age_group: "adults",
    rating: 4.7,
    reviews: 54,
    location: "Phuket Town",
    schedule: "Пн, Ср - 19:00"
  },
  {
    id: "5",
    title_en: "Robotics for Kids",
    title_ru: "Робототехника для детей",
    description_en: "Build and program robots with LEGO",
    description_ru: "Собирайте и программируйте роботов с LEGO",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
    price: 250,
    currency: "฿",
    duration: "2 часа",
    category: "technology",
    age_group: "kids",
    rating: 4.9,
    reviews: 89,
    location: "Cherngtalay, Phuket",
    schedule: "Сб - 14:00"
  },
  {
    id: "6",
    title_en: "Yoga & Meditation",
    title_ru: "Йога и медитация",
    description_en: "Find balance and inner peace with experienced instructors",
    description_ru: "Обретите баланс и внутренний покой с опытными инструкторами",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    price: 180,
    currency: "฿",
    duration: "1.5 часа",
    category: "sports",
    age_group: "adults",
    rating: 4.8,
    reviews: 112,
    location: "Kamala, Phuket",
    schedule: "Ежедневно - 07:00"
  }
];

const tutors = [
  {
    id: "t1",
    name: "Sarah Johnson",
    specialty_en: "English Teacher",
    specialty_ru: "Преподаватель английского",
    description_en: "Native speaker with 10+ years teaching experience",
    description_ru: "Носитель языка с 10+ летним опытом преподавания",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    price: 500,
    currency: "฿",
    subjects: ["English", "IELTS", "TOEFL"],
    age_groups: ["kids", "adults"],
    rating: 4.9,
    reviews: 156,
    location: "Patong, Phuket"
  },
  {
    id: "t2",
    name: "Somchai Wongsa",
    specialty_en: "Thai Language Expert",
    specialty_ru: "Эксперт тайского языка",
    description_en: "Professional Thai teacher for foreigners",
    description_ru: "Профессиональный преподаватель тайского для иностранцев",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    price: 400,
    currency: "฿",
    subjects: ["Thai", "Thai Culture"],
    age_groups: ["adults"],
    rating: 4.8,
    reviews: 98,
    location: "Phuket Town"
  },
  {
    id: "t3",
    name: "Maria Petrova",
    specialty_en: "Math & Physics Tutor",
    specialty_ru: "Репетитор по математике и физике",
    description_en: "PhD in Physics, prepares for exams and olympiads",
    description_ru: "Кандидат физ-мат наук, подготовка к экзаменам и олимпиадам",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
    price: 600,
    currency: "฿",
    subjects: ["Math", "Physics", "IB"],
    age_groups: ["kids", "adults"],
    rating: 5.0,
    reviews: 87,
    location: "Online / Kata"
  },
  {
    id: "t4",
    name: "John Smith",
    specialty_en: "Music Teacher",
    specialty_ru: "Преподаватель музыки",
    description_en: "Guitar, piano and ukulele lessons for all ages",
    description_ru: "Уроки гитары, фортепиано и укулеле для всех возрастов",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    price: 450,
    currency: "฿",
    subjects: ["Guitar", "Piano", "Ukulele"],
    age_groups: ["kids", "adults"],
    rating: 4.7,
    reviews: 64,
    location: "Rawai, Phuket"
  }
];

const categories = [
  { id: "all", label_en: "All", label_ru: "Все", icon: BookOpen },
  { id: "languages", label_en: "Languages", label_ru: "Языки", icon: GraduationCap },
  { id: "creative", label_en: "Creative", label_ru: "Творчество", icon: Star },
  { id: "technology", label_en: "Technology", label_ru: "Технологии", icon: Users },
  { id: "sports", label_en: "Sports", label_ru: "Спорт", icon: Clock }
];

export default function EducationIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [ageFilter, setAgeFilter] = useState<"all" | "kids" | "adults">("all");

  const filteredCourses = courses.filter(course => {
    const title = language === "ru" ? course.title_ru : course.title_en;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesAge = ageFilter === "all" || course.age_group === ageFilter;
    return matchesSearch && matchesCategory && matchesAge;
  });

  const filteredTutors = tutors.filter(tutor => {
    const name = tutor.name.toLowerCase();
    const specialty = language === "ru" ? tutor.specialty_ru : tutor.specialty_en;
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                          specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = ageFilter === "all" || tutor.age_groups.includes(ageFilter);
    return matchesSearch && matchesAge;
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 pb-24">
          <h1 className="text-2xl font-bold mb-2">
            {language === "ru" ? "Образование" : "Education"}
          </h1>
          <p className="text-white/80">
            {language === "ru" ? "Курсы и репетиторы для детей и взрослых" : "Courses and tutors for kids and adults"}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="px-4 -mt-16 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={language === "ru" ? "Поиск курсов и репетиторов..." : "Search courses and tutors..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card shadow-lg border-0"
            />
          </div>

          {/* Age Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={ageFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setAgeFilter("all")}
              className="whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-1" />
              {language === "ru" ? "Все" : "All"}
            </Button>
            <Button
              variant={ageFilter === "kids" ? "default" : "outline"}
              size="sm"
              onClick={() => setAgeFilter("kids")}
              className="whitespace-nowrap"
            >
              <Baby className="h-4 w-4 mr-1" />
              {language === "ru" ? "Для детей" : "For Kids"}
            </Button>
            <Button
              variant={ageFilter === "adults" ? "default" : "outline"}
              size="sm"
              onClick={() => setAgeFilter("adults")}
              className="whitespace-nowrap"
            >
              <User className="h-4 w-4 mr-1" />
              {language === "ru" ? "Для взрослых" : "For Adults"}
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="whitespace-nowrap"
              >
                <cat.icon className="h-4 w-4 mr-1" />
                {language === "ru" ? cat.label_ru : cat.label_en}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="mt-6 px-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              {language === "ru" ? "Курсы" : "Courses"}
            </TabsTrigger>
            <TabsTrigger value="tutors">
              <GraduationCap className="h-4 w-4 mr-2" />
              {language === "ru" ? "Репетиторы" : "Tutors"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4 space-y-4">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => navigate(`/education/course/${course.id}`)}
                className="bg-card rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <img
                    src={course.image}
                    alt={language === "ru" ? course.title_ru : course.title_en}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {language === "ru" ? course.title_ru : course.title_en}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {language === "ru" ? course.description_ru : course.description_en}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${course.age_group === "kids" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                        {course.age_group === "kids" 
                          ? (language === "ru" ? "Дети" : "Kids") 
                          : (language === "ru" ? "Взрослые" : "Adults")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{course.rating}</span>
                      <span>({course.reviews})</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {course.location}
                      </div>
                      <span className="font-bold text-primary">
                        {course.currency}{course.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="tutors" className="mt-4 space-y-4">
            {filteredTutors.map(tutor => (
              <div
                key={tutor.id}
                onClick={() => navigate(`/education/tutor/${tutor.id}`)}
                className="bg-card rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <img
                    src={tutor.image}
                    alt={tutor.name}
                    className="w-28 h-28 object-cover"
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{tutor.name}</h3>
                        <p className="text-sm text-primary">
                          {language === "ru" ? tutor.specialty_ru : tutor.specialty_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{tutor.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {language === "ru" ? tutor.description_ru : tutor.description_en}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tutor.subjects.slice(0, 3).map(subject => (
                        <span key={subject} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {subject}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {tutor.location}
                      </div>
                      <span className="font-bold text-primary">
                        {tutor.currency}{tutor.price}/{language === "ru" ? "час" : "hr"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users, Baby, User, Star, Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MiniAppLayout, ItemCard, type MiniAppCategory } from "@/components/miniapp";
import { FilterValues, educationFilterConfig } from "@/components/filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '📚' },
  { id: 'languages', labelEn: 'Languages', labelRu: 'Языки', icon: '🌍' },
  { id: 'creative', labelEn: 'Creative', labelRu: 'Творчество', icon: '🎨' },
  { id: 'technology', labelEn: 'Technology', labelRu: 'Технологии', icon: '💻' },
  { id: 'sports', labelEn: 'Sports', labelRu: 'Спорт', icon: '⚽' },
];

const courses = [
  {
    id: "1",
    title_en: "English for Kids",
    title_ru: "Английский для детей",
    description_en: "Fun and interactive English lessons for children 5-12 years",
    description_ru: "Веселые интерактивные уроки английского для детей 5-12 лет",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    price: 150,
    duration: "1 час",
    category: "languages",
    age_group: "kids",
    rating: 4.9,
    reviews: 128,
    location: "Patong, Phuket",
  },
  {
    id: "2",
    title_en: "Thai Language Course",
    title_ru: "Курс тайского языка",
    description_en: "Learn Thai from native speakers, beginner to advanced",
    description_ru: "Изучайте тайский с носителями языка, от начального до продвинутого",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400",
    price: 200,
    duration: "1.5 часа",
    category: "languages",
    age_group: "adults",
    rating: 4.8,
    reviews: 95,
    location: "Kata, Phuket",
  },
  {
    id: "3",
    title_en: "Art & Creativity for Kids",
    title_ru: "Творчество для детей",
    description_en: "Drawing, painting and crafts for children 4-10 years",
    description_ru: "Рисование, живопись и поделки для детей 4-10 лет",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
    price: 120,
    duration: "1.5 часа",
    category: "creative",
    age_group: "kids",
    rating: 4.9,
    reviews: 76,
    location: "Rawai, Phuket",
  },
  {
    id: "4",
    title_en: "Programming for Beginners",
    title_ru: "Программирование для начинающих",
    description_en: "Learn Python and web development basics",
    description_ru: "Изучите основы Python и веб-разработки",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400",
    price: 300,
    duration: "2 часа",
    category: "technology",
    age_group: "adults",
    rating: 4.7,
    reviews: 54,
    location: "Phuket Town",
  },
  {
    id: "5",
    title_en: "Robotics for Kids",
    title_ru: "Робототехника для детей",
    description_en: "Build and program robots with LEGO",
    description_ru: "Собирайте и программируйте роботов с LEGO",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
    price: 250,
    duration: "2 часа",
    category: "technology",
    age_group: "kids",
    rating: 4.9,
    reviews: 89,
    location: "Cherngtalay, Phuket",
  },
  {
    id: "6",
    title_en: "Yoga & Meditation",
    title_ru: "Йога и медитация",
    description_en: "Find balance and inner peace with experienced instructors",
    description_ru: "Обретите баланс и внутренний покой с опытными инструкторами",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    price: 180,
    duration: "1.5 часа",
    category: "sports",
    age_group: "adults",
    rating: 4.8,
    reviews: 112,
    location: "Kamala, Phuket",
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
    subjects: ["Math", "Physics", "IB"],
    age_groups: ["kids", "adults"],
    rating: 5.0,
    reviews: 87,
    location: "Online / Kata"
  },
];

export default function EducationIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeTab, setActiveTab] = useState("courses");

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const title = language === "ru" ? course.title_ru : course.title_en;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
      
      // Category filter
      const cats = filterValues.category as string[] | undefined;
      if (cats?.length && !cats.includes(course.category)) return false;
      
      // Age group filter
      const ages = filterValues.ageGroup as string[] | undefined;
      if (ages?.length && !ages.includes(course.age_group)) return false;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, filterValues, language]);

  const filteredTutors = useMemo(() => {
    return tutors.filter(tutor => {
      const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (language === "ru" ? tutor.specialty_ru : tutor.specialty_en).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Age group filter
      const ages = filterValues.ageGroup as string[] | undefined;
      if (ages?.length && !ages.some(a => tutor.age_groups.includes(a))) return false;
      
      return matchesSearch;
    });
  }, [searchQuery, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === "ru" ? "Образование" : "Education"}
      subtitle={language === "ru" ? "Курсы и репетиторы" : "Courses and tutors"}
      heroIcon={GraduationCap}
      heroTitle={language === "ru" ? "Образование" : "Education"}
      heroSubtitle={language === "ru" ? "Курсы и репетиторы для детей и взрослых" : "Courses and tutors for kids and adults"}
      heroGradientFrom="from-indigo-500/20"
      heroGradientVia="via-purple-500/20"
      heroGradientTo="to-primary/20"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === "ru" ? "Поиск курсов и репетиторов..." : "Search courses and tutors..."}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={educationFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      showCategories={activeTab === 'courses'}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
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
            <ItemCard
              key={course.id}
              image={course.image}
              title={language === "ru" ? course.title_ru : course.title_en}
              subtitle={language === "ru" ? course.description_ru : course.description_en}
              rating={course.rating}
              reviewCount={course.reviews}
              location={course.location}
              price={course.price}
              currency="฿"
              badge={course.age_group === "kids" 
                ? { text: language === "ru" ? "Дети" : "Kids", className: "bg-pink-100 text-pink-600" }
                : { text: language === "ru" ? "Взрослые" : "Adults", className: "bg-blue-100 text-blue-600" }
              }
              tags={[course.duration]}
              onClick={() => navigate(`/education/course/${course.id}`)}
            />
          ))}
          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {language === "ru" ? "Курсы не найдены" : "No courses found"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tutors" className="mt-4 space-y-4">
          {filteredTutors.map(tutor => (
            <ItemCard
              key={tutor.id}
              image={tutor.image}
              title={tutor.name}
              subtitle={language === "ru" ? tutor.description_ru : tutor.description_en}
              rating={tutor.rating}
              reviewCount={tutor.reviews}
              location={tutor.location}
              price={tutor.price}
              priceUnit={`/${language === "ru" ? "час" : "hr"}`}
              currency="฿"
              tags={tutor.subjects.slice(0, 3)}
              onClick={() => navigate(`/education/tutor/${tutor.id}`)}
            />
          ))}
          {filteredTutors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {language === "ru" ? "Репетиторы не найдены" : "No tutors found"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MiniAppLayout>
  );
}
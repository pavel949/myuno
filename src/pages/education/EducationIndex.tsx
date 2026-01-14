import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import { MiniAppLayout, ItemCard, type MiniAppCategory } from "@/components/miniapp";
import { FilterValues, educationFilterConfig } from "@/components/filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEducationProviders } from "@/hooks/useEducation";
import { Skeleton } from "@/components/ui/skeleton";

const categories: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '📚' },
  { id: 'tutor', labelEn: 'Tutors', labelRu: 'Репетиторы', icon: '👨‍🏫' },
  { id: 'school', labelEn: 'Schools', labelRu: 'Школы', icon: '🏫' },
];

export default function EducationIndex() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeTab, setActiveTab] = useState("all");
  
  const { providers, isLoading } = useEducationProviders(selectedCategory);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
  }, [filterValues]);

  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      const name = language === "ru" ? provider.name_ru : provider.name_en;
      const description = language === "ru" ? provider.description_ru : provider.description_en;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      // Age group filter
      const ages = filterValues.ageGroup as string[] | undefined;
      if (ages?.length && !ages.some(a => provider.age_groups?.includes(a))) return false;
      
      // Tab filter
      if (activeTab !== 'all' && provider.provider_type !== activeTab) return false;
      
      return matchesSearch;
    });
  }, [searchQuery, filterValues, language, providers, activeTab]);

  const tutors = filteredProviders.filter(p => p.provider_type === 'tutor');
  const schools = filteredProviders.filter(p => p.provider_type === 'school');

  return (
    <MiniAppLayout
      title={t('education.heroTitle')}
      subtitle={t('education.heroSubtitle')}
      heroIcon={GraduationCap}
      heroTitle={t('education.heroTitle')}
      heroSubtitle={t('education.heroSubtitle')}
      heroImage="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"
      heroGradient={{ from: 'from-indigo-500/20', via: 'via-purple-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('education.searchPlaceholder')}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={educationFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('education.all')}
          </TabsTrigger>
          <TabsTrigger value="tutor">
            <GraduationCap className="h-4 w-4 mr-2" />
            {t('education.tutors')}
          </TabsTrigger>
          <TabsTrigger value="school">
            🏫
            <span className="ml-2">{t('education.schools')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))
          ) : (
            <>
              {filteredProviders.map(provider => (
                <ItemCard
                  key={provider.id}
                  image={provider.cover_image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400"}
                  title={language === "ru" ? provider.name_ru : provider.name_en}
                  subtitle={language === "ru" ? provider.description_ru : provider.description_en}
                  rating={provider.rating}
                  reviewCount={provider.review_count}
                  price={provider.price_per_hour || provider.price_per_course}
                  priceUnit={provider.price_per_hour ? `/${language === "ru" ? "час" : "hr"}` : undefined}
                  currency="฿"
                  badge={provider.provider_type === "tutor" 
                    ? { text: t('education.tutor'), className: "bg-blue-100 text-blue-600" }
                    : { text: t('education.school'), className: "bg-purple-100 text-purple-600" }
                  }
                  tags={provider.subjects?.slice(0, 3) || []}
                  onClick={() => navigate(`/education/tutor/${provider.id}`)}
                />
              ))}
              {filteredProviders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('education.notFound')}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="tutor" className="mt-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))
          ) : (
            <>
              {tutors.map(tutor => (
                <ItemCard
                  key={tutor.id}
                  image={tutor.cover_image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400"}
                  title={language === "ru" ? tutor.name_ru : tutor.name_en}
                  subtitle={language === "ru" ? tutor.description_ru : tutor.description_en}
                  rating={tutor.rating}
                  reviewCount={tutor.review_count}
                  price={tutor.price_per_hour}
                  priceUnit={`/${language === "ru" ? "час" : "hr"}`}
                  currency="฿"
                  badge={tutor.is_online 
                    ? { text: "Online", className: "bg-green-100 text-green-600" }
                    : undefined
                  }
                  tags={tutor.subjects?.slice(0, 3) || []}
                  onClick={() => navigate(`/education/tutor/${tutor.id}`)}
                />
              ))}
              {tutors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('education.tutorsNotFound')}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="school" className="mt-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))
          ) : (
            <>
              {schools.map(school => (
                <ItemCard
                  key={school.id}
                  image={school.cover_image || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400"}
                  title={language === "ru" ? school.name_ru : school.name_en}
                  subtitle={language === "ru" ? school.description_ru : school.description_en}
                  rating={school.rating}
                  reviewCount={school.review_count}
                  price={school.price_per_course || school.price_per_hour}
                  priceUnit={school.price_per_course ? `/${language === "ru" ? "курс" : "course"}` : `/${language === "ru" ? "час" : "hr"}`}
                  currency="฿"
                  badge={school.is_verified 
                    ? { text: t('education.verified'), className: "bg-emerald-100 text-emerald-600" }
                    : undefined
                  }
                  tags={school.subjects?.slice(0, 3) || []}
                  onClick={() => navigate(`/education/tutor/${school.id}`)}
                />
              ))}
              {schools.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('education.schoolsNotFound')}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </MiniAppLayout>
  );
}

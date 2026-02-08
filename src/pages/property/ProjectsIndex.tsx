/**
 * ProjectsIndex - Catalog page for all residential complexes
 * Featured carousel + all projects grid with search/filter
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { ProjectCard } from '@/components/property/ProjectCard';
import { AdaptiveBottomNav } from '@/components/layout/AdaptiveBottomNav';
import { cn } from '@/lib/utils';

// Phuket districts for filtering
const districts = [
  { id: 'all', en: 'All Areas', ru: 'Все районы' },
  { id: 'Patong', en: 'Patong', ru: 'Патонг' },
  { id: 'Rawai', en: 'Rawai', ru: 'Равай' },
  { id: 'Kamala', en: 'Kamala', ru: 'Камала' },
  { id: 'Kata', en: 'Kata', ru: 'Ката' },
  { id: 'Karon', en: 'Karon', ru: 'Карон' },
  { id: 'Surin', en: 'Surin', ru: 'Сурин' },
  { id: 'Bang Tao', en: 'Bang Tao', ru: 'Банг Тао' },
  { id: 'Nai Harn', en: 'Nai Harn', ru: 'Най Харн' },
  { id: 'Chalong', en: 'Chalong', ru: 'Чалонг' },
  { id: 'Phuket Town', en: 'Phuket Town', ru: 'Пхукет Таун' },
];

export default function ProjectsIndex() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: projects, isLoading } = usePropertyProjects();
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  
  // Deep-link highlight support
  const highlightId = searchParams.get('highlight');

  // Handle scroll to highlighted project
  useEffect(() => {
    if (highlightId && !isLoading && projects) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(`project-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary', 'animate-pulse');
          setTimeout(() => {
            element.classList.remove('animate-pulse');
          }, 2000);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightId, isLoading, projects]);

  // Filter and categorize projects
  const { featured, filtered } = useMemo(() => {
    if (!projects) return { featured: [], filtered: [] };

    let result = projects;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name_en.toLowerCase().includes(searchLower) ||
        p.name_ru.toLowerCase().includes(searchLower) ||
        p.developer_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply district filter (case-insensitive, supports slug and display formats)
    if (selectedDistrict !== 'all') {
      const filterLower = selectedDistrict.toLowerCase().replace(/\s+/g, '-');
      result = result.filter(p => {
        if (!p.district) return false;
        const districtLower = p.district.toLowerCase().replace(/\s+/g, '-');
        return districtLower === filterLower || p.district.toLowerCase() === selectedDistrict.toLowerCase();
      });
    }

    // Separate featured projects
    const featured = result.filter(p => p.is_featured);
    
    return { featured, filtered: result };
  }, [projects, search, selectedDistrict]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState branded />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Жилые комплексы Пхукета' : 'Phuket Residential Complexes'} | myUNO</title>
        <meta 
          name="description" 
          content={isRu 
            ? 'Выберите резиденцию для идеального отдыха на Пхукете' 
            : 'Choose a residence for your perfect vacation in Phuket'
          } 
        />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-12 pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="h-4 w-4" />
              {projects?.length || 0} {isRu ? 'комплексов' : 'complexes'}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold">
              {isRu ? 'Жилые комплексы' : 'Residential Complexes'}
              <span className="block text-primary">
                {isRu ? 'Пхукета' : 'of Phuket'}
              </span>
            </h1>
            
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isRu 
                ? 'Выберите резиденцию для вашего идеального отдыха или инвестиции' 
                : 'Choose a residence for your perfect vacation or investment'
              }
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск комплекса...' : 'Search complex...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-background border-border/50"
              />
            </div>
          </div>
        </section>

        {/* District filters */}
        <section className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
              {districts.map((district) => (
                <Button
                  key={district.id}
                  variant={selectedDistrict === district.id ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0 rounded-full"
                  onClick={() => setSelectedDistrict(district.id)}
                >
                  {isRu ? district.ru : district.en}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Featured Projects */}
          {featured.length > 0 && !search && selectedDistrict === 'all' && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                ⭐ {isRu ? 'Рекомендуемые комплексы' : 'Featured Complexes'}
              </h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {featured.map((project) => (
                  <div key={project.id} className="w-80 flex-shrink-0 snap-start">
                    <ProjectCard project={project} variant="featured" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Projects Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isRu ? 'Все комплексы' : 'All Complexes'}
                {filtered.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">
                    ({filtered.length})
                  </span>
                )}
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {search 
                    ? (isRu ? 'Комплексы не найдены' : 'No complexes found')
                    : (isRu ? 'Нет доступных комплексов' : 'No complexes available')
                  }
                </p>
                {search && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearch('')}
                  >
                    {isRu ? 'Сбросить поиск' : 'Clear search'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((project) => (
                  <div 
                    key={project.id} 
                    id={`project-${project.id}`}
                    className="transition-all duration-300"
                  >
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <AdaptiveBottomNav />
      </div>
    </>
  );
}

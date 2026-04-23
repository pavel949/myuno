import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/uno/PageContainer';
import { SEOHead } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgeBySection, getSectionMeta, KNOWLEDGE_SECTIONS } from '@/hooks/useLocationKnowledge';
import { RelatedServicesLinks } from '@/components/knowledge';
import { 
  Globe, Landmark, CheckCircle, Building2, TreePine, 
  Briefcase, AlertTriangle, BookOpen 
} from 'lucide-react';
// Icon map for section icons
const sectionIconMap: Record<string, React.ElementType> = {
  Globe,
  Landmark,
  CheckCircle,
  Building2,
  TreePine,
  Briefcase,
  AlertTriangle,
  BookOpen,
};

export default function KnowledgeSectionPage() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { getCityName } = useLocation();
  const { language } = useLanguage();
  const { data: articles, isLoading } = useKnowledgeBySection(section || '');

  const cityName = getCityName(language as 'en' | 'ru' | 'th');
  const sectionMeta = getSectionMeta(section || '', language as 'en' | 'ru');
  
  // Get icon component dynamically
  const IconComponent = sectionMeta?.icon 
    ? sectionIconMap[sectionMeta.icon] || BookOpen 
    : BookOpen;

  const pageTitle = sectionMeta 
    ? `${sectionMeta.label} — ${cityName}` 
    : 'Knowledge Hub';

  return (
    <>
      <SEOHead 
        title={pageTitle}
        description={language === 'ru' 
          ? `${sectionMeta?.label || 'Информация'} о ${cityName}`
          : `${sectionMeta?.label || 'Information'} about ${cityName}`
        }
      />
      
      <PageContainer className="pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/knowledge')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <IconComponent className="h-6 w-6 text-primary" />
              {sectionMeta?.label || section}
            </h1>
            <p className="text-sm text-muted-foreground">{cityName}</p>
          </div>
        </div>

        {/* Articles List */}
        <section className="mb-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-none" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map(article => (
                <Card 
                  key={article.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => navigate(`/knowledge/${section}/${article.slug}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {article.icon && <span>{article.icon}</span>}
                        {article.title}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  {article.summary && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.summary}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'ru' 
                    ? 'Контент для этого раздела скоро появится'
                    : 'Content for this section coming soon'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Related Services */}
        <RelatedServicesLinks section={section} />
      </PageContainer>
    </>
  );
}

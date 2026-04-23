import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, Smartphone, Lock, Brain, MapPin, Building, 
  Coins, Leaf, CheckCircle2, Clock
} from 'lucide-react';

interface RoadmapItem {
  titleRu: string;
  titleEn: string;
  descRu: string;
  descEn: string;
  icon: React.ElementType;
  status: 'done' | 'in-progress' | 'planned';
}

const roadmap2025: RoadmapItem[] = [
  {
    titleRu: 'Dynamic Pricing',
    titleEn: 'Dynamic Pricing',
    descRu: 'AI-ценообразование на основе спроса',
    descEn: 'AI pricing based on demand',
    icon: TrendingUp,
    status: 'in-progress',
  },
  {
    titleRu: 'Guest Portal (MyStay)',
    titleEn: 'Guest Portal (MyStay)',
    descRu: 'Self-service для гостей',
    descEn: 'Guest self-service portal',
    icon: Smartphone,
    status: 'planned',
  },
  {
    titleRu: 'Smart Locks',
    titleEn: 'Smart Locks',
    descRu: 'Интеграция с умными замками',
    descEn: 'Smart lock integration',
    icon: Lock,
    status: 'planned',
  },
  {
    titleRu: 'AI Photo Analysis',
    titleEn: 'AI Photo Analysis',
    descRu: 'Автоматическое распознавание повреждений',
    descEn: 'Automatic damage detection',
    icon: Brain,
    status: 'planned',
  },
];

const roadmap2026: RoadmapItem[] = [
  {
    titleRu: 'Расширение географии',
    titleEn: 'Geographic Expansion',
    descRu: 'Самуи, Паттайя, Бангкок',
    descEn: 'Samui, Pattaya, Bangkok',
    icon: MapPin,
    status: 'planned',
  },
  {
    titleRu: 'B2B White-label',
    titleEn: 'B2B White-label',
    descRu: 'Решение для управляющих компаний',
    descEn: 'Solution for property managers',
    icon: Building,
    status: 'planned',
  },
  {
    titleRu: 'Финтех-интеграции',
    titleEn: 'Fintech Integrations',
    descRu: 'Мгновенные выплаты, криптовалюты',
    descEn: 'Instant payouts, crypto',
    icon: Coins,
    status: 'planned',
  },
  {
    titleRu: 'Sustainable Hosting',
    titleEn: 'Sustainable Hosting',
    descRu: 'Эко-сертификация объектов',
    descEn: 'Property eco-certification',
    icon: Leaf,
    status: 'planned',
  },
];

function StatusBadge({ status }: { status: 'done' | 'in-progress' | 'planned' }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        {isRu ? 'Готово' : 'Done'}
      </span>
    );
  }
  if (status === 'in-progress') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-info bg-info/10 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />
        {isRu ? 'В работе' : 'In Progress'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      {isRu ? 'Планируется' : 'Planned'}
    </span>
  );
}

export function GuideRoadmap() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-8">
      <section id="roadmap" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Развитие системы' : 'System Roadmap'}
        </h2>

        <p className="text-muted-foreground mb-8">
          {isRu 
            ? 'Наши планы по развитию платформы на ближайшие годы:'
            : 'Our platform development plans for the coming years:'
          }
        </p>

        {/* 2025 */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="px-2 py-1 bg-primary text-primary-foreground rounded-none text-sm">2025</span>
              {isRu ? 'Автоматизация и Guest Experience' : 'Automation & Guest Experience'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {roadmap2025.map((item) => (
                <div key={item.titleEn} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-none">
                  <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {isRu ? item.titleRu : item.titleEn}
                      </h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? item.descRu : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2026 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="px-2 py-1 bg-secondary text-foreground rounded-none text-sm">2026</span>
              {isRu ? 'Масштабирование и инновации' : 'Scaling & Innovation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {roadmap2026.map((item) => (
                <div key={item.titleEn} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-none">
                  <div className="w-10 h-10 rounded-none bg-muted flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground text-sm">
                        {isRu ? item.titleRu : item.titleEn}
                      </h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? item.descRu : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

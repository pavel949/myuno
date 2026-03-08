import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Globe, FileText, Database, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMapsStatusCard } from '@/components/admin/GoogleMapsStatusCard';

const systemSections = [
  { key: 'cities', label: 'Cities', labelRu: 'Города', icon: Globe, path: '/admin/cities' },
  { key: 'translations', label: 'Translations', labelRu: 'Переводы', icon: FileText, path: '/admin/translations' },
  { key: 'lookups', label: 'Lookups', labelRu: 'Справочники', icon: Database, path: '/admin/lookups' },
  { key: 'knowledge', label: 'Knowledge Base', labelRu: 'База знаний', icon: FileText, path: '/admin/location-knowledge' },
];

export function ControlSystemTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <GoogleMapsStatusCard />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isRussian ? 'Системные настройки' : 'System Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemSections.map((section) => (
              <Card 
                key={section.key}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigate(section.path)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{isRussian ? section.labelRu : section.label}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

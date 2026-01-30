import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  FileText, 
  Stethoscope, 
  Scale, 
  AlertTriangle,
  PawPrint,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ServiceLink {
  icon: React.ElementType;
  label: string;
  route: string;
  section?: string; // Optional: show only for specific knowledge sections
}

const serviceLinks: { en: ServiceLink[]; ru: ServiceLink[] } = {
  en: [
    { icon: CreditCard, label: 'Banking Services', route: '/banking', section: 'practical' },
    { icon: FileText, label: 'Visa & Immigration', route: '/visa', section: 'government' },
    { icon: Stethoscope, label: 'Medical Services', route: '/medical', section: 'emergency' },
    { icon: Scale, label: 'Legal Services', route: '/legal', section: 'government' },
    { icon: AlertTriangle, label: 'Emergency SOS', route: '/sos', section: 'emergency' },
    { icon: PawPrint, label: 'Veterinary', route: '/veterinary', section: 'nature' },
  ],
  ru: [
    { icon: CreditCard, label: 'Банковские услуги', route: '/banking', section: 'practical' },
    { icon: FileText, label: 'Визы и иммиграция', route: '/visa', section: 'government' },
    { icon: Stethoscope, label: 'Медицинские услуги', route: '/medical', section: 'emergency' },
    { icon: Scale, label: 'Юридические услуги', route: '/legal', section: 'government' },
    { icon: AlertTriangle, label: 'Экстренная помощь', route: '/sos', section: 'emergency' },
    { icon: PawPrint, label: 'Ветеринария', route: '/veterinary', section: 'nature' },
  ],
};

interface RelatedServicesLinksProps {
  section?: string;
  showAll?: boolean;
  className?: string;
}

export function RelatedServicesLinks({ section, showAll = false, className }: RelatedServicesLinksProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const allLinks = serviceLinks[language as 'en' | 'ru'] || serviceLinks.en;
  
  // Filter by section if provided, otherwise show all
  const links = showAll || !section 
    ? allLinks 
    : allLinks.filter(link => !link.section || link.section === section);

  if (links.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground mb-3">
        {language === 'ru' ? 'Связанные сервисы UNO' : 'Related UNO Services'}
      </h4>
      <div className="flex flex-wrap gap-2">
        {links.map((link, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate(link.route)}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Button>
        ))}
      </div>
    </div>
  );
}

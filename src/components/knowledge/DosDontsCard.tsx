import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DosDontsItem {
  text: string;
}

interface DosDontsCardProps {
  dos?: DosDontsItem[];
  donts?: DosDontsItem[];
  className?: string;
}

// Default Phuket data (will be replaced by DB content)
const phuketDosDonts = {
  en: {
    dos: [
      { text: 'Remove shoes before entering homes and temples' },
      { text: 'Dress modestly when visiting temples' },
      { text: 'Show respect to the Royal Family' },
      { text: 'Use the "wai" greeting (hands together)' },
      { text: 'Smile often – Thailand is the "Land of Smiles"' },
    ],
    donts: [
      { text: "Don't touch anyone's head – it's sacred" },
      { text: "Don't point feet at people or Buddha images" },
      { text: "Don't disrespect the King or Royal Family" },
      { text: "Don't raise your voice or show anger in public" },
      { text: "Don't wear shoes inside temples" },
    ],
  },
  ru: {
    dos: [
      { text: 'Снимайте обувь перед входом в дом и храмы' },
      { text: 'Одевайтесь скромно при посещении храмов' },
      { text: 'Проявляйте уважение к королевской семье' },
      { text: 'Используйте приветствие "вай" (руки вместе)' },
      { text: 'Улыбайтесь чаще – Таиланд "Страна улыбок"' },
    ],
    donts: [
      { text: 'Не трогайте голову людей – это священно' },
      { text: 'Не направляйте ноги на людей или изображения Будды' },
      { text: 'Не проявляйте неуважение к королю' },
      { text: 'Не повышайте голос и не показывайте гнев на публике' },
      { text: 'Не носите обувь в храмах' },
    ],
  },
};

export function DosDontsCard({ dos, donts, className }: DosDontsCardProps) {
  const { language } = useLanguage();
  
  // Use provided data or fallback to Phuket defaults
  const defaultData = phuketDosDonts[language as 'en' | 'ru'] || phuketDosDonts.en;
  const displayDos = dos || defaultData.dos;
  const displayDonts = donts || defaultData.donts;

  return (
    <div className={cn("grid md:grid-cols-2 gap-4", className)}>
      {/* Do's Card */}
      <Card className="border-green-200 dark:border-green-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-full">
              <Check className="h-4 w-4" />
            </div>
            {language === 'ru' ? 'Что делать' : "Do's"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayDos.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{item.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Don'ts Card */}
      <Card className="border-red-200 dark:border-red-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
              <X className="h-4 w-4" />
            </div>
            {language === 'ru' ? 'Чего не делать' : "Don'ts"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayDonts.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-foreground">{item.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

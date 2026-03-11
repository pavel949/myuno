import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { importTargets, ImportTarget } from '@/lib/importTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Package, 
  Store, 
  UtensilsCrossed, 
  Scissors, 
  Ship, 
  Map, 
  Wrench,
  CheckCircle,
  ContactRound
} from 'lucide-react';

interface ImportTargetSelectorProps {
  selectedTarget: string | null;
  onSelect: (targetId: string) => void;
}

const targetIcons: Record<string, React.ReactNode> = {
  providers: <Building2 className="h-5 w-5" />,
  marketplace_products: <Package className="h-5 w-5" />,
  marketplace_vendors: <Store className="h-5 w-5" />,
  restaurants: <UtensilsCrossed className="h-5 w-5" />,
  salons: <Scissors className="h-5 w-5" />,
  yachts: <Ship className="h-5 w-5" />,
  tours: <Map className="h-5 w-5" />,
  services: <Wrench className="h-5 w-5" />,
  crm_contacts: <ContactRound className="h-5 w-5" />,
};

export function ImportTargetSelector({ selectedTarget, onSelect }: ImportTargetSelectorProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        {language === 'ru' ? 'Выберите целевую таблицу' : 'Select Target Table'}
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {importTargets.map((target) => (
          <Card
            key={target.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTarget === target.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelect(target.id)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
              <div className={`p-2 rounded-lg ${
                selectedTarget === target.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {targetIcons[target.id] || <Package className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium">
                {language === 'ru' ? target.nameRu : target.name}
              </span>
              {selectedTarget === target.id && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedTarget && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          {(() => {
            const target = importTargets.find(t => t.id === selectedTarget);
            if (!target) return null;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Обязательные поля:' : 'Required fields:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {target.requiredFields.map(field => (
                      <Badge key={field} variant="destructive" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Опциональные:' : 'Optional:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {target.optionalFields.slice(0, 5).map(field => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {target.optionalFields.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{target.optionalFields.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

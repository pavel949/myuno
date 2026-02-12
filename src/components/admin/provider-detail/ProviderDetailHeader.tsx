import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Edit } from 'lucide-react';
import { ContentCreatorMenu } from '@/components/admin/ContentCreatorMenu';
import type { ProviderDetails } from '@/hooks/useProviderDetails';

interface Props {
  provider: ProviderDetails;
}

export function ProviderDetailHeader({ provider }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex items-center gap-4 mb-2">
      <Button variant="ghost" size="icon" onClick={() => navigate('/admin/providers')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold truncate">{provider.name}</h1>
          {provider.is_verified ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {isRu ? 'Верифицирован' : 'Verified'}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <XCircle className="h-3 w-3" />
              {isRu ? 'Не верифицирован' : 'Not Verified'}
            </Badge>
          )}
          {!provider.is_active && (
            <Badge variant="destructive">{isRu ? 'Неактивен' : 'Inactive'}</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{provider.business_category}</p>
      </div>
      <div className="flex items-center gap-2">
        <ContentCreatorMenu 
          providerId={provider.id} 
          providerName={provider.name}
          size="sm"
        />
        <Button variant="outline" onClick={() => navigate(`/admin/providers?edit=${provider.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          {isRu ? 'Редактировать' : 'Edit'}
        </Button>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Building2, Store, ChevronRight, Plus } from 'lucide-react';

export function AccountRoleWidgets() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { hasRole } = useUserContext();
  const { companies } = useActiveCompany();
  const isRu = language === 'ru';

  const isOwner = hasRole('owner');
  const isVendor = hasRole('vendor');
  const hasCompany = companies.length > 0;

  if (!isOwner && !isVendor && !hasCompany) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {isRu ? 'Рабочие области' : 'Workspaces'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isOwner && (
          <Card className="hover:shadow-elevation-2 transition-shadow cursor-pointer group" onClick={() => navigate('/owner')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-accent-teal/15">
                <Home className="h-5 w-5 text-accent-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{isRu ? 'Мои объекты' : 'My Properties'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu ? 'Управление недвижимостью' : 'Manage your properties'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        )}

        {hasCompany && (
          <Card className="hover:shadow-elevation-2 transition-shadow cursor-pointer group" onClick={() => navigate('/mc')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary/15">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{isRu ? 'УК Workspace' : 'MC Workspace'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {companies.length} {isRu ? 'компаний' : 'companies'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        )}

        {isVendor && (
          <Card className="hover:shadow-elevation-2 transition-shadow cursor-pointer group" onClick={() => navigate('/vendor')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-accent-purple/15">
                <Store className="h-5 w-5 text-accent-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{isRu ? 'Панель провайдера' : 'Vendor Panel'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isRu ? 'Сервисы и аналитика' : 'Services & analytics'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </CardContent>
          </Card>
        )}

        {!isOwner && (
          <Card className="border-dashed hover:shadow-elevation-2 transition-shadow cursor-pointer group" onClick={() => navigate('/list-with-us')}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-muted-foreground">{isRu ? 'Разместить объект' : 'List with UNO'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

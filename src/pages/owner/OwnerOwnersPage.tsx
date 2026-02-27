/**
 * Owner Account Management — List of property owners with aggregated KPIs
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerAccounts } from '@/hooks/useOwnerAccounts';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Users,
  Building2,
  FileCheck,
  FileWarning,
  Phone,
  Mail,
  Gift,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function OwnerOwnersPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: owners, isLoading } = useOwnerAccounts();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!owners) return [];
    if (!search.trim()) return owners;
    const q = search.toLowerCase();
    return owners.filter(o =>
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q)
    );
  }, [owners, search]);

  // Upcoming birthdays
  const upcomingBirthdays = useMemo(() => {
    if (!owners) return [];
    const today = new Date();
    return owners
      .filter(o => o.birthday)
      .map(o => {
        const bd = parseISO(o.birthday!);
        const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
        const days = differenceInDays(thisYear, today);
        return { ...o, daysUntilBirthday: days };
      })
      .filter(o => o.daysUntilBirthday <= 30)
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }, [owners]);

  const totalProperties = owners?.reduce((s, o) => s + o.properties_count, 0) || 0;
  const missingDocs = owners?.filter(o => !o.has_contract || !o.has_passport).length || 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRu ? 'Собственники' : 'Property Owners'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Управление отношениями с собственниками' : 'Owner relationship management'}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/owner/contacts')} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{owners?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Собственников' : 'Owners'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalProperties}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Объектов' : 'Properties'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{(owners?.length || 0) - missingDocs}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Документы ОК' : 'Docs OK'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{missingDocs}</p>
              <p className="text-xs text-muted-foreground">{isRu ? 'Нет документов' : 'Missing docs'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {isRu ? 'Ближайшие дни рождения' : 'Upcoming Birthdays'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingBirthdays.slice(0, 5).map(o => (
                <Badge
                  key={o.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/owner/owners/${o.id}`)}
                >
                  {o.first_name} {o.last_name} —{' '}
                  {o.daysUntilBirthday === 0
                    ? (isRu ? 'сегодня!' : 'today!')
                    : `${isRu ? 'через' : 'in'} ${o.daysUntilBirthday} ${isRu ? 'дн.' : 'd.'}`
                  }
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по имени, email, телефону...' : 'Search by name, email, phone...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Owner list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">
              {isRu ? 'Нет собственников' : 'No owners found'}
            </p>
            <p className="text-sm mt-1">
              {isRu
                ? 'Добавьте контакт с типом "Собственник" в CRM'
                : 'Add a contact with type "Owner" in CRM'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(owner => (
            <Card
              key={owner.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/owner/owners/${owner.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={owner.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {owner.first_name[0]}{owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">
                        {owner.first_name} {owner.last_name}
                      </span>
                      {owner.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] shrink-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {owner.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {owner.phone}
                        </span>
                      )}
                      {owner.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {owner.email}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        <Building2 className="h-3 w-3 mr-1" />
                        {owner.properties_count} {isRu ? 'объ.' : 'prop.'}
                      </Badge>
                      {owner.avg_occupancy > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {owner.avg_occupancy}% {isRu ? 'загр.' : 'occ.'}
                        </Badge>
                      )}
                      {owner.total_revenue > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          ฿{owner.total_revenue.toLocaleString()}
                        </Badge>
                      )}
                      {!owner.has_contract && (
                        <Badge variant="destructive" className="text-[10px]">
                          {isRu ? 'Нет договора' : 'No contract'}
                        </Badge>
                      )}
                      {owner.birthday && (() => {
                        const bd = parseISO(owner.birthday);
                        const today = new Date();
                        const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
                        if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
                        const days = differenceInDays(thisYear, today);
                        if (days <= 7) return (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                            <Gift className="h-3 w-3 mr-1" />
                            {days === 0 ? '🎂' : `${days}d`}
                          </Badge>
                        );
                        return null;
                      })()}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

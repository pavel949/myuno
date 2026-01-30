import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProspects, statusConfig, priorityConfig, type VendorProspect } from '@/hooks/useVendorAcquisition';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorProspectDetail } from './VendorProspectDetail';
import { Search, Star, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function VendorProspectsTable() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { data: prospects, isLoading, refetch } = useVendorProspects();
  const [search, setSearch] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<VendorProspect | null>(null);

  const filteredProspects = prospects?.filter(p => 
    p.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.district?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRussian ? 'Поиск лидов...' : 'Search leads...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {isRussian ? 'Обновить' : 'Refresh'}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isRussian ? 'Бизнес' : 'Business'}</TableHead>
              <TableHead>{isRussian ? 'Категория' : 'Category'}</TableHead>
              <TableHead>{isRussian ? 'Локация' : 'Location'}</TableHead>
              <TableHead>{isRussian ? 'Статус' : 'Status'}</TableHead>
              <TableHead>{isRussian ? 'Приоритет' : 'Priority'}</TableHead>
              <TableHead>{isRussian ? 'AI Score' : 'AI Score'}</TableHead>
              <TableHead>{isRussian ? 'Источник' : 'Source'}</TableHead>
              <TableHead>{isRussian ? 'Добавлен' : 'Added'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет лидов' : 'No leads found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProspects.map((prospect) => {
                const status = statusConfig[prospect.status];
                const priority = priorityConfig[prospect.ai_priority || ''];
                const location = prospect.district || prospect.city;
                
                return (
                  <TableRow 
                    key={prospect.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedProspect(prospect)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {prospect.business_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{prospect.business_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {prospect.category || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(status?.color, status?.bgColor)}
                      >
                        {isRussian ? status?.labelRu : status?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {priority ? (
                        <Badge 
                          variant="outline"
                          className={cn(priority?.color, priority?.bgColor)}
                        >
                          {priority?.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prospect.ai_score !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>{prospect.ai_score}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {prospect.source_type?.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(prospect.created_at), 'dd.MM.yy')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      {selectedProspect && (
        <VendorProspectDetail
          prospect={selectedProspect}
          open={!!selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}
    </div>
  );
}

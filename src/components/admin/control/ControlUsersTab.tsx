import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function ControlUsersTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-profiles', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isRussian ? 'Пользователи' : 'Users'}
            </CardTitle>
            <Badge variant="secondary">
              {profiles?.length || 0} {isRussian ? 'записей' : 'records'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRussian ? 'Поиск пользователей...' : 'Search users...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRussian ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRussian ? 'Имя' : 'Name'}</TableHead>
                      <TableHead>{isRussian ? 'Email' : 'Email'}</TableHead>
                      <TableHead>{isRussian ? 'Телефон' : 'Phone'}</TableHead>
                      <TableHead>{isRussian ? 'Дата' : 'Date'}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles?.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || '—'}
                        </TableCell>
                        <TableCell>{profile.email || '—'}</TableCell>
                        <TableCell>{profile.phone || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!profiles || profiles.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {isRussian ? 'Пользователи не найдены' : 'No users found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

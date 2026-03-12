import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, Trash2, Search, Loader2, UserCheck, Mail } from 'lucide-react';

interface MCMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface MCMemberManagerProps {
  companyId: string;
  companyName: string;
}

const ROLE_OPTIONS = [
  { value: 'director', labelEn: 'Director', labelRu: 'Директор' },
  { value: 'manager', labelEn: 'Manager', labelRu: 'Менеджер' },
  { value: 'staff', labelEn: 'Staff', labelRu: 'Сотрудник' },
  { value: 'accountant', labelEn: 'Accountant', labelRu: 'Бухгалтер' },
];

export function MCMemberManager({ companyId, companyName }: MCMemberManagerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [members, setMembers] = useState<MCMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newRole, setNewRole] = useState('manager');
  const [isAdding, setIsAdding] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('management_company_members')
      .select('id, user_id, role, is_active, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for each member
    const memberIds = (data || []).map(m => m.user_id);
    const profiles: Record<string, { id: string; full_name: string | null; email?: string; phone?: string | null }> = {};
    if (memberIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', memberIds);
      
      (profileData || []).forEach(p => { profiles[p.id] = p; });
    }

    setMembers((data || []).map(m => ({
      ...m,
      profile: profiles[m.user_id] ? {
        full_name: profiles[m.user_id].full_name ?? null,
        email: profiles[m.user_id].email ?? null,
        phone: profiles[m.user_id].phone ?? null,
      } : undefined,
    })));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [companyId]);

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setFoundUser(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', `%${searchEmail.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error(isRu ? 'Пользователь не найден' : 'User not found');
    } else {
      setFoundUser(data);
    }
    setIsSearching(false);
  };

  const handleAddMember = async () => {
    if (!foundUser) return;
    
    // Check if already a member
    const existing = members.find(m => m.user_id === foundUser.id);
    if (existing) {
      toast.error(isRu ? 'Уже является сотрудником' : 'Already a member');
      return;
    }

    setIsAdding(true);
    const { error } = await supabase
      .from('management_company_members')
      .insert({
        company_id: companyId,
        user_id: foundUser.id,
        role: newRole,
        is_active: true,
      });

    if (error) {
      toast.error(isRu ? 'Ошибка добавления' : 'Error adding member');
      console.error(error);
    } else {
      // Also ensure user has owner role for MC access
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: foundUser.id, role: 'owner' as const }, { onConflict: 'user_id,role' });
      
      if (roleError) console.warn('Could not auto-assign role:', roleError);
      
      toast.success(isRu ? 'Сотрудник добавлен' : 'Member added');
      setFoundUser(null);
      setSearchEmail('');
      fetchMembers();
    }
    setIsAdding(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('management_company_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error(isRu ? 'Ошибка удаления' : 'Error removing');
    } else {
      toast.success(isRu ? 'Сотрудник удалён' : 'Member removed');
      fetchMembers();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">
        {isRu ? 'Сотрудники' : 'Team Members'} ({members.length})
      </h3>

      {/* Current Members */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isRu ? 'Загрузка...' : 'Loading...'}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Нет привязанных сотрудников' : 'No members linked'}
        </p>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <Card key={member.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {member.profile?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.profile?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {ROLE_OPTIONS.find(r => r.value === member.role)?.[isRu ? 'labelRu' : 'labelEn'] || member.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member */}
      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-medium">
          {isRu ? 'Добавить сотрудника' : 'Add Member'}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Email пользователя...' : 'User email...'}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleSearchUser} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {foundUser && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{foundUser.full_name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {isRu ? r.labelRu : r.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddMember} disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

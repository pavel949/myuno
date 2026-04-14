import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnoTeamMembers, VERTICALS, VERTICAL_LABELS, type Vertical, type UnoTeamMember } from '@/hooks/useUnoTeamPermissions';
import { supabase } from '@/integrations/supabase/client';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, Settings, Shield, Plus, Check, X, 
  Pencil, Trash2, Send, Eye, UserPlus, Search, Mail
} from 'lucide-react';

export default function AdminUnoTeam() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { members, isLoading, updatePermission, grantAllPermissions } = useUnoTeamMembers();
  const [selectedMember, setSelectedMember] = useState<UnoTeamMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
const queryClient = useQueryClient();

  const handleAddMember = async () => {
    if (!addEmail.trim()) {
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: isRu ? 'Введите email' : 'Enter email',
      });
      return;
    }

    setIsAdding(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', addEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        toast.error(isRu ? 'Пользователь не найден' : 'User not found', {
          description: isRu ? 'Убедитесь, что пользователь зарегистрирован' : 'Make sure the user is registered',
        });
        setIsAdding(false);
        return;
      }

      // Check if already has uno_team role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('role', 'uno_team')
        .single();

      if (existingRole) {
        toast.error(isRu ? 'Уже в команде' : 'Already in team', {
          description: isRu ? 'Этот пользователь уже является членом myUNO Team' : 'This user is already a myUNO Team member',
        });
        setIsAdding(false);
        return;
      }

      // Add uno_team role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role: 'uno_team' });

      if (roleError) throw roleError;

      toast(isRu ? 'Успешно' : 'Success', {
        description: isRu ? `${profile.full_name || profile.email} добавлен в myUNO Team` : `${profile.full_name || profile.email} added to myUNO Team`,
      });

      queryClient.invalidateQueries({ queryKey: ['uno-team-members'] });
      setShowAddDialog(false);
      setAddEmail('');
    } catch (err) {
      console.error('Error adding member:', err);
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: isRu ? 'Не удалось добавить сотрудника' : 'Failed to add member',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    try {
      // Remove role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'uno_team');

      if (roleError) throw roleError;

      // Remove permissions
      await supabase
        .from('uno_team_permissions')
        .delete()
        .eq('user_id', userId);

      toast(isRu ? 'Удалено' : 'Removed', {
        description: isRu ? `${memberName} удалён из myUNO Team` : `${memberName} removed from myUNO Team`,
      });

      queryClient.invalidateQueries({ queryKey: ['uno-team-members'] });
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(isRu ? 'Ошибка' : 'Error', {
        description: isRu ? 'Не удалось удалить сотрудника' : 'Failed to remove member',
      });
    }
  };

  const handlePermissionChange = async (
    userId: string,
    vertical: Vertical,
    field: 'can_create' | 'can_edit' | 'can_delete' | 'can_submit_for_review',
    value: boolean
  ) => {
    await updatePermission({
      userId,
      vertical,
      permissions: { [field]: value },
    });
  };

  const handleGrantAll = async (userId: string) => {
    await grantAllPermissions({ userId, verticals: [...VERTICALS] });
  };

  const filteredMembers = members?.filter(m => 
    !searchQuery || 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'myUNO Team' : 'myUNO Team'}
          showBack
        />

        {/* Header with stats and actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <Users className="h-4 w-4" />
              {members?.length || 0} {isRu ? 'сотрудников' : 'members'}
            </Badge>
          </div>
          
          {/* Add Member Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                {isRu ? 'Добавить сотрудника' : 'Add Member'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRu ? 'Добавить сотрудника myUNO Team' : 'Add myUNO Team Member'}</DialogTitle>
                <DialogDescription>
                  {isRu 
                    ? 'Введите email зарегистрированного пользователя для добавления в команду' 
                    : 'Enter the email of a registered user to add them to the team'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isRu ? 'Email пользователя' : 'User Email'}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRu 
                      ? 'Пользователь должен быть зарегистрирован в системе' 
                      : 'User must be registered in the system'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </Button>
                <Button onClick={handleAddMember} disabled={isAdding}>
                  {isAdding ? (isRu ? 'Добавление...' : 'Adding...') : (isRu ? 'Добавить' : 'Add')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        {members && members.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRu ? 'Поиск по имени или email...' : 'Search by name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Members List */}
        {(!members || members.length === 0) ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{isRu ? 'Нет сотрудников myUNO Team' : 'No myUNO Team members'}</p>
              <p className="text-sm mt-2 mb-4">
                {isRu 
                  ? 'Добавьте первого сотрудника, нажав кнопку выше' 
                  : 'Add your first team member using the button above'}
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                {isRu ? 'Добавить сотрудника' : 'Add Member'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMembers?.map(member => (
              <Card key={member.user_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          {member.full_name?.charAt(0) || member.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {member.full_name || member.email || 'Unknown'}
                        </CardTitle>
                        <CardDescription className="text-sm">{member.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {member.permissions.length} {isRu ? 'вертикалей' : 'verticals'}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedMember(member)}>
                            <Settings className="h-4 w-4 mr-1" />
                            {isRu ? 'Права' : 'Permissions'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-primary" />
                              {isRu ? 'Права доступа: ' : 'Permissions: '}
                              {member.full_name || member.email}
                            </DialogTitle>
                          </DialogHeader>
                          <PermissionMatrix 
                            member={member} 
                            isRu={isRu} 
                            onPermissionChange={handlePermissionChange}
                            onGrantAll={() => handleGrantAll(member.user_id)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveMember(member.user_id, member.full_name || member.email || 'User')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {member.permissions.length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {isRu ? 'Нет назначенных вертикалей' : 'No assigned verticals'}
                      </span>
                    ) : (
                      member.permissions.map(perm => (
                        <Badge 
                          key={perm.vertical} 
                          variant="outline"
                          className="gap-1"
                        >
                          {VERTICAL_LABELS[perm.vertical]?.[isRu ? 'ru' : 'en'] || perm.vertical}
                          <div className="flex gap-0.5 ml-1">
                            {perm.can_create && <Plus className="h-3 w-3 text-success" />}
                            {perm.can_edit && <Pencil className="h-3 w-3 text-info" />}
                            {perm.can_delete && <Trash2 className="h-3 w-3 text-destructive" />}
                          </div>
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

function PermissionMatrix({
  member,
  isRu,
  onPermissionChange,
  onGrantAll,
}: {
  member: UnoTeamMember;
  isRu: boolean;
  onPermissionChange: (userId: string, vertical: Vertical, field: 'can_create' | 'can_edit' | 'can_delete' | 'can_submit_for_review', value: boolean) => Promise<void>;
  onGrantAll: () => Promise<void>;
}) {
  const getPermission = (vertical: Vertical) => {
    return member.permissions.find(p => p.vertical === vertical);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="default" size="sm" onClick={onGrantAll} className="gap-2">
          <Shield className="h-4 w-4" />
          {isRu ? 'Дать все права' : 'Grant all permissions'}
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">{isRu ? 'Вертикаль' : 'Vertical'}</TableHead>
              <TableHead className="text-center w-20">
                <div className="flex flex-col items-center gap-1">
                  <Plus className="h-4 w-4 text-success" />
                  <span className="text-xs">{isRu ? 'Создание' : 'Create'}</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-20">
                <div className="flex flex-col items-center gap-1">
                  <Pencil className="h-4 w-4 text-info" />
                  <span className="text-xs">{isRu ? 'Редактир.' : 'Edit'}</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-20">
                <div className="flex flex-col items-center gap-1">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="text-xs">{isRu ? 'Удаление' : 'Delete'}</span>
                </div>
              </TableHead>
              <TableHead className="text-center w-20">
                <div className="flex flex-col items-center gap-1">
                  <Send className="h-4 w-4 text-accent-purple" />
                  <span className="text-xs">{isRu ? 'Модерация' : 'Submit'}</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VERTICALS.map((vertical, index) => {
              const perm = getPermission(vertical);
              return (
                <TableRow key={vertical} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                  <TableCell className="font-medium">
                    {VERTICAL_LABELS[vertical]?.[isRu ? 'ru' : 'en'] || vertical}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm?.can_create || false}
                      onCheckedChange={(checked) => 
                        onPermissionChange(member.user_id, vertical, 'can_create', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm?.can_edit || false}
                      onCheckedChange={(checked) => 
                        onPermissionChange(member.user_id, vertical, 'can_edit', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm?.can_delete || false}
                      onCheckedChange={(checked) => 
                        onPermissionChange(member.user_id, vertical, 'can_delete', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={perm?.can_submit_for_review || false}
                      onCheckedChange={(checked) => 
                        onPermissionChange(member.user_id, vertical, 'can_submit_for_review', !!checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

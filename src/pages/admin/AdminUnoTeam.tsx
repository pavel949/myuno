import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnoTeamMembers, VERTICALS, VERTICAL_LABELS, type Vertical, type UnoTeamMember } from '@/hooks/useUnoTeamPermissions';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Settings, Shield, Plus, Check, X, 
  Pencil, Trash2, Send, Eye
} from 'lucide-react';

export default function AdminUnoTeam() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { members, isLoading, updatePermission, grantAllPermissions } = useUnoTeamMembers();
  const [selectedMember, setSelectedMember] = useState<UnoTeamMember | null>(null);

  if (isLoading) {
    return (
      <AppLayout title={isRu ? 'Управление UNO Team' : 'UNO Team Management'}>
        <div className="container py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

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

  return (
    <AppLayout title={isRu ? 'Управление UNO Team' : 'UNO Team Management'}>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isRu ? 'Команда UNO' : 'UNO Team'}</h1>
            <p className="text-muted-foreground">
              {isRu ? 'Управление доступами и правами сотрудников' : 'Manage team member permissions'}
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Users className="h-4 w-4" />
            {members?.length || 0} {isRu ? 'сотрудников' : 'members'}
          </Badge>
        </div>

        {/* Members List */}
        {members?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRu ? 'Нет сотрудников UNO Team' : 'No UNO Team members'}</p>
              <p className="text-sm mt-2">
                {isRu 
                  ? 'Назначьте роль uno_team пользователям через таблицу user_roles' 
                  : 'Assign uno_team role to users via user_roles table'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {members?.map(member => (
              <Card key={member.user_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.full_name?.charAt(0) || member.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {member.full_name || member.email || 'Unknown'}
                        </CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {member.permissions.length} {isRu ? 'вертикалей' : 'verticals'}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedMember(member)}>
                            <Settings className="h-4 w-4 mr-1" />
                            {isRu ? 'Настроить' : 'Configure'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>
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
                            {perm.can_create && <Plus className="h-3 w-3 text-green-600" />}
                            {perm.can_edit && <Pencil className="h-3 w-3 text-blue-600" />}
                            {perm.can_delete && <Trash2 className="h-3 w-3 text-red-600" />}
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
      </div>
    </AppLayout>
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
        <Button variant="outline" size="sm" onClick={onGrantAll}>
          <Shield className="h-4 w-4 mr-1" />
          {isRu ? 'Дать все права' : 'Grant all permissions'}
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isRu ? 'Вертикаль' : 'Vertical'}</TableHead>
            <TableHead className="text-center w-24">
              <div className="flex flex-col items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="text-xs">{isRu ? 'Создание' : 'Create'}</span>
              </div>
            </TableHead>
            <TableHead className="text-center w-24">
              <div className="flex flex-col items-center gap-1">
                <Pencil className="h-4 w-4" />
                <span className="text-xs">{isRu ? 'Редактир.' : 'Edit'}</span>
              </div>
            </TableHead>
            <TableHead className="text-center w-24">
              <div className="flex flex-col items-center gap-1">
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">{isRu ? 'Удаление' : 'Delete'}</span>
              </div>
            </TableHead>
            <TableHead className="text-center w-24">
              <div className="flex flex-col items-center gap-1">
                <Send className="h-4 w-4" />
                <span className="text-xs">{isRu ? 'Модерация' : 'Submit'}</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {VERTICALS.map(vertical => {
            const perm = getPermission(vertical);
            return (
              <TableRow key={vertical}>
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
  );
}

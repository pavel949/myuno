import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { useTeamMember, SPECIALIZATION_LABELS, type TeamSpecialization } from '@/hooks/useTeamMember';
import { useMyGamification } from '@/hooks/useTeamGamification';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsDisplay } from '@/components/team/gamification/PointsDisplay';
import { AchievementsGrid } from '@/components/team/gamification/AchievementCard';
import { 
  User, Phone, Mail, Calendar, Edit2, Save, X, Loader2,
  LogOut, Settings
} from 'lucide-react';
import { format } from 'date-fns';

export default function TeamProfilePage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { member, isLoading, updateProfile, isUpdating } = useTeamMember();
  const { stats, achievements } = useMyGamification();
  const isRu = language === 'ru';

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    bio: '',
  });

  const handleEdit = () => {
    setFormData({
      display_name: member?.display_name || '',
      phone: member?.phone || '',
      bio: member?.bio || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <TeamLayout title={isRu ? 'Мой профиль' : 'My Profile'}>
        <div className="py-6 px-4 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout title={isRu ? 'Мой профиль' : 'My Profile'}>
      <div className="py-6 px-4 space-y-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={member?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {member?.display_name?.charAt(0) || user?.email?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{isRu ? 'Имя' : 'Display Name'}</Label>
                      <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData(f => ({ ...f, display_name: e.target.value }))}
                        placeholder={isRu ? 'Ваше имя' : 'Your name'}
                      />
                    </div>
                    <div>
                      <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+66..."
                      />
                    </div>
                    <div>
                      <Label>{isRu ? 'О себе' : 'Bio'}</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
                        placeholder={isRu ? 'Расскажите о себе...' : 'Tell us about yourself...'}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        {isRu ? 'Сохранить' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-1" />
                        {isRu ? 'Отмена' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-bold">
                          {member?.display_name || (isRu ? 'Член команды' : 'Team Member')}
                        </h2>
                        <p className="text-muted-foreground text-sm">{user?.email}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        {isRu ? 'Редактировать' : 'Edit'}
                      </Button>
                    </div>
                    
                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {member?.specializations?.map(spec => {
                        const label = SPECIALIZATION_LABELS[spec as TeamSpecialization];
                        return (
                          <Badge 
                            key={spec} 
                            variant="secondary"
                            className={label?.color}
                          >
                            {isRu ? label?.ru : label?.en}
                          </Badge>
                        );
                      })}
                      {(!member?.specializations || member.specializations.length === 0) && (
                        <Badge variant="outline">
                          {isRu ? 'Нет специализации' : 'No specialization'}
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-4 space-y-2 text-sm">
                      {member?.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </div>
                      )}
                      {member?.hired_at && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {isRu ? 'В команде с' : 'Joined'} {format(new Date(member.hired_at), 'MMMM yyyy')}
                        </div>
                      )}
                    </div>

                    {member?.bio && (
                      <p className="mt-4 text-sm text-muted-foreground">{member.bio}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <PointsDisplay />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Всего очков' : 'Total Points'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{achievements?.length || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Достижений' : 'Achievements'}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Дней подряд' : 'Day Streak'}</p>
          </Card>
        </div>

        {/* Achievements */}
        <AchievementsGrid />

        {/* Actions */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isRu ? 'Выйти' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </TeamLayout>
  );
}

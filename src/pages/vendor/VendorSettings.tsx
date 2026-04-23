import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Globe,
  ChevronRight,
  LogOut
} from 'lucide-react';

const VendorSettings = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { profile } = useVendorProfile();
  const isRussian = language === 'ru';

  const settingsGroups = [
    {
      title: isRussian ? 'Аккаунт' : 'Account',
      items: [
        {
          icon: User,
          label: isRussian ? 'Профиль компании' : 'Company Profile',
          description: isRussian ? 'Название, логотип, описание' : 'Name, logo, description',
          action: () => navigate('/vendor/onboarding'),
        },
        {
          icon: Bell,
          label: isRussian ? 'Уведомления' : 'Notifications',
          description: isRussian ? 'Email и push-уведомления' : 'Email and push notifications',
          badge: isRussian ? 'Скоро' : 'Soon',
        },
      ],
    },
    {
      title: isRussian ? 'Бизнес' : 'Business',
      items: [
        {
          icon: CreditCard,
          label: isRussian ? 'Подписка' : 'Subscription',
          description: isRussian ? 'Ваш тарифный план' : 'Your pricing plan',
          action: () => navigate('/vendor/subscription'),
        },
        {
          icon: Globe,
          label: isRussian ? 'Локации' : 'Locations',
          description: isRussian ? 'Адреса и точки обслуживания' : 'Addresses and service areas',
          action: () => navigate('/vendor/locations'),
        },
      ],
    },
    {
      title: isRussian ? 'Безопасность' : 'Security',
      items: [
        {
          icon: Shield,
          label: isRussian ? 'Пароль и безопасность' : 'Password & Security',
          description: isRussian ? 'Изменить пароль' : 'Change password',
          action: () => navigate('/profile/settings'),
        },
      ],
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            {isRussian ? 'Настройки' : 'Settings'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRussian ? 'Управление вашим аккаунтом и настройками' : 'Manage your account and preferences'}
          </p>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => (
                  <React.Fragment key={itemIndex}>
                    <button
                      onClick={item.action}
                      disabled={!item.action}
                      className="w-full flex items-center gap-3 p-3 rounded-none hover:bg-muted/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      {item.action && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    {itemIndex < group.items.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isRussian ? 'Выйти из аккаунта' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{user?.email}</p>
          {profile && (
            <p className="mt-1">
              {isRussian ? 'ID провайдера:' : 'Provider ID:'} {profile.id.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default VendorSettings;

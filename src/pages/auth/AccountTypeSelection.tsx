import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgs } from '@/hooks/useUserContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Home, Building2, Users, ArrowRight, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

type AccountType = 'owner' | 'management_company' | 'representative';

interface AccountTypeOption {
  id: AccountType;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}

const accountTypes: AccountTypeOption[] = [
  {
    id: 'owner',
    icon: <Home className="h-8 w-8" />,
    titleEn: 'Property Owner',
    titleRu: 'Собственник',
    descEn: 'I manage my own property',
    descRu: 'Управляю своим объектом',
  },
  {
    id: 'management_company',
    icon: <Building2 className="h-8 w-8" />,
    titleEn: 'Management Company / Agent',
    titleRu: 'УК / Агент',
    descEn: "I manage clients' properties",
    descRu: 'Управляю объектами клиентов',
  },
  {
    id: 'representative',
    icon: <Users className="h-8 w-8" />,
    titleEn: 'Representative',
    titleRu: 'Представитель',
    descEn: 'Acting on behalf of owner (POA)',
    descRu: 'Действую по доверенности',
  },
];

export default function AccountTypeSelection() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createOrg, isCreating } = useOrgs();
  const { defaultPath: ownerDefaultPath } = useOwnerType();
  const isRu = language === 'ru';
  const redirectTo = searchParams.get('redirect') || ownerDefaultPath || '/owner';

  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) {
      toast.error(isRu ? 'Выберите тип аккаунта' : 'Select account type');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedType === 'management_company') {
        if (!companyName.trim()) {
          toast.error(isRu ? 'Введите название компании' : 'Enter company name');
          setIsSubmitting(false);
          return;
        }

        // Create organization
        await createOrg({
          name: companyName,
          org_type: 'management_company' as any,
        });

        toast.success(isRu ? 'Компания создана!' : 'Company created!');
      }

      // Navigate to owner dashboard or add property
      navigate(redirectTo);
    } catch (error) {
      logger.error('Error setting up account:', error);
      toast.error(isRu ? 'Ошибка настройки аккаунта' : 'Error setting up account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer className="max-w-2xl mx-auto">
      <div className="py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {isRu ? 'Как вы будете использовать платформу?' : 'How will you use the platform?'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Это поможет нам настроить ваш аккаунт' 
              : 'This helps us set up your account'}
          </p>
        </div>

        <div className="grid gap-4">
          {accountTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all ${
                selectedType === type.id
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl ${
                  selectedType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {isRu ? type.titleRu : type.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? type.descRu : type.descEn}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  selectedType === type.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                }`}>
                  {selectedType === type.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Company name input for management company */}
        {selectedType === 'management_company' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Название компании' : 'Company Name'} *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={isRu ? 'ООО "Управляющая компания"' : 'Property Management Co.'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isRu 
                  ? 'Вы сможете добавить контактные данные и логотип позже' 
                  : 'You can add contact details and logo later'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info about representative */}
        {selectedType === 'representative' && (
          <Card className="border-accent-amber/30 bg-accent-amber/5">
            <CardContent className="p-6">
              <p className="text-sm">
                {isRu 
                  ? '📋 При добавлении объекта вы сможете указать контактные данные реального собственника. После регистрации собственника на платформе, владение объектом можно будет передать ему.' 
                  : "📋 When adding a property, you'll be able to enter the actual owner's contact details. Once they register on the platform, ownership can be transferred to them."}
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={!selectedType || isSubmitting || isCreating}
        >
          {isSubmitting || isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isRu ? 'Настройка...' : 'Setting up...'}
            </>
          ) : (
            <>
              {isRu ? 'Продолжить' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {isRu 
            ? 'Вы всегда можете изменить настройки в профиле' 
            : 'You can always change settings in your profile'}
        </p>
      </div>
    </PageContainer>
  );
}

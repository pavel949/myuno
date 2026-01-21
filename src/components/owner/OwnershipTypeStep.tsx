import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Home, Building2, FileText, Mail, Phone, User } from 'lucide-react';

export type OwnershipType = 'own' | 'client' | 'poa';

interface OwnershipData {
  ownership_type: OwnershipType;
  actual_owner_email: string;
  actual_owner_name: string;
  actual_owner_phone: string;
  send_invite_immediately: boolean;
}

interface OwnershipTypeStepProps {
  data: OwnershipData;
  onChange: (data: Partial<OwnershipData>) => void;
}

interface OwnershipOption {
  id: OwnershipType;
  icon: React.ReactNode;
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
}

const ownershipOptions: OwnershipOption[] = [
  {
    id: 'own',
    icon: <Home className="h-5 w-5" />,
    titleEn: 'My own property',
    titleRu: 'Мой объект',
    descEn: 'I am the legal owner',
    descRu: 'Я являюсь собственником',
  },
  {
    id: 'client',
    icon: <Building2 className="h-5 w-5" />,
    titleEn: "Client's property",
    titleRu: 'Объект клиента',
    descEn: 'I manage this property for a client (MC / Agent)',
    descRu: 'Я управляю этим объектом для клиента (УК / Агент)',
  },
  {
    id: 'poa',
    icon: <FileText className="h-5 w-5" />,
    titleEn: 'Power of Attorney',
    titleRu: 'По доверенности',
    descEn: 'I act on behalf of the owner under POA',
    descRu: 'Действую от имени собственника по доверенности',
  },
];

export function OwnershipTypeStep({ data, onChange }: OwnershipTypeStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const showOwnerFields = data.ownership_type === 'client' || data.ownership_type === 'poa';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'Чей это объект?' : 'Whose property is this?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownershipOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => onChange({ ownership_type: option.id })}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                data.ownership_type === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                data.ownership_type === option.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {isRu ? option.titleRu : option.titleEn}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isRu ? option.descRu : option.descEn}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                data.ownership_type === option.id
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              }`}>
                {data.ownership_type === option.id && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Owner contact fields */}
      {showOwnerFields && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {isRu ? 'Данные собственника' : 'Owner Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Укажите контактные данные реального собственника для приглашения на платформу' 
                : "Enter the actual owner's contact details to invite them to the platform"}
            </p>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {isRu ? 'Имя собственника' : 'Owner Name'}
              </Label>
              <Input
                value={data.actual_owner_name}
                onChange={(e) => onChange({ actual_owner_name: e.target.value })}
                placeholder={isRu ? 'Иван Петров' : 'John Smith'}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {isRu ? 'Email собственника' : 'Owner Email'}
              </Label>
              <Input
                type="email"
                value={data.actual_owner_email}
                onChange={(e) => onChange({ actual_owner_email: e.target.value })}
                placeholder="owner@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {isRu ? 'Телефон собственника' : 'Owner Phone'} ({isRu ? 'опционально' : 'optional'})
              </Label>
              <Input
                type="tel"
                value={data.actual_owner_phone}
                onChange={(e) => onChange({ actual_owner_phone: e.target.value })}
                placeholder="+66 XXX XXX XXXX"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">
                  {isRu ? 'Отправить приглашение сразу' : 'Send invitation immediately'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Собственник получит email с приглашением' 
                    : 'Owner will receive an email invitation'}
                </p>
              </div>
              <Switch
                checked={data.send_invite_immediately}
                onCheckedChange={(checked) => onChange({ send_invite_immediately: checked })}
              />
            </div>

            {data.ownership_type === 'poa' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  📋 {isRu 
                    ? 'После регистрации собственника на платформе вы сможете передать ему владение объектом' 
                    : 'Once the owner registers on the platform, you can transfer ownership to them'}
                </p>
              </div>
            )}

            {data.ownership_type === 'client' && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm">
                  🏢 {isRu 
                    ? 'Вы останетесь управляющей компанией для этого объекта. Собственник получит доступ к просмотру отчётов' 
                    : "You'll remain the management company for this property. The owner will get access to view reports"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

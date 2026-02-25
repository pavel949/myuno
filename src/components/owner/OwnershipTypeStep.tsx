import { memo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Home, FileSignature, MessageCircle, Mail, Phone, User, Upload, Shield, AlertTriangle } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Checkbox } from '@/components/ui/checkbox';

export type OwnershipType = 'own' | 'management_agreement' | 'verbal';

interface OwnershipData {
  ownership_type: OwnershipType;
  actual_owner_email: string;
  actual_owner_name: string;
  actual_owner_phone: string;
  send_invite_immediately: boolean;
  management_document_url?: string;
  management_document_name?: string;
  commercial_terms_redacted?: boolean;
  ownership_document_url?: string;
  ownership_document_name?: string;
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
  requiresVerification: boolean;
  verificationNoteEn?: string;
  verificationNoteRu?: string;
}

const ownershipOptions: OwnershipOption[] = [
  {
    id: 'own',
    icon: <Home className="h-5 w-5" />,
    titleEn: 'My own property',
    titleRu: 'Мой объект',
    descEn: 'I am the legal owner of this property',
    descRu: 'Я являюсь законным собственником',
    requiresVerification: false,
    verificationNoteEn: 'myUNO reserves the right to verify ownership with the Juristic Person. You may upload a supporting document (title deed, Chanote, etc.) to expedite verification.',
    verificationNoteRu: 'myUNO оставляет за собой право верифицировать право собственности через юридическое лицо здания. Вы можете загрузить подтверждающий документ (свидетельство о собственности, Chanote и т.д.) для ускорения верификации.',
  },
  {
    id: 'management_agreement',
    icon: <FileSignature className="h-5 w-5" />,
    titleEn: 'Management Agreement / POA',
    titleRu: 'Договор управления / Доверенность',
    descEn: 'I manage this property under a formal contract or Power of Attorney',
    descRu: 'Управление по договору или доверенности',
    requiresVerification: true,
    verificationNoteEn: 'We need a copy of the management agreement or POA to verify your right to list this property. Commercial terms can be redacted.',
    verificationNoteRu: 'Нам потребуется копия договора управления или доверенности для верификации права на размещение. Коммерческие условия можно скрыть.',
  },
  {
    id: 'verbal',
    icon: <MessageCircle className="h-5 w-5" />,
    titleEn: 'Verbal Agreement',
    titleRu: 'Устные договорённости',
    descEn: 'I manage this property based on a verbal arrangement with the owner',
    descRu: 'Управляю на основании устных договорённостей с собственником',
    requiresVerification: true,
    verificationNoteEn: 'We will need to contact the property owner to verify this arrangement. Please provide their contact details.',
    verificationNoteRu: 'Нам потребуется связаться с собственником для подтверждения договорённости. Укажите его контактные данные.',
  },
];

function OwnershipTypeStepInner({ data, onChange }: OwnershipTypeStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const selectedOption = ownershipOptions.find(o => o.id === data.ownership_type);
  const showOwnershipDocUpload = data.ownership_type === 'own';
  const showDocumentUpload = data.ownership_type === 'management_agreement';
  const showOwnerFields = data.ownership_type === 'management_agreement' || data.ownership_type === 'verbal';
  const isVerbalAgreement = data.ownership_type === 'verbal';

  return (
    <div className="space-y-6">
      {/* Verification Purpose Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {isRu ? 'Верификация прав на управление' : 'Management Rights Verification'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isRu 
                  ? 'Мы проверяем право на управление и сдачу в аренду для защиты всех участников' 
                  : 'We verify management and listing rights to protect all parties involved'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {isRu ? 'На каком основании вы управляете объектом?' : 'What is your management basis?'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownershipOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => onChange({ ownership_type: option.id })}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                data.ownership_type === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                data.ownership_type === option.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {isRu ? option.titleRu : option.titleEn}
                  </p>
                  {option.requiresVerification && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      {isRu ? 'Верификация' : 'Verification'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu ? option.descRu : option.descEn}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
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

      {/* Ownership Document Upload for Own Property */}
      {showOwnershipDocUpload && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isRu ? 'Подтверждение права собственности' : 'Ownership Verification'}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({isRu ? 'опционально' : 'optional'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 border border-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ {isRu ? selectedOption?.verificationNoteRu : selectedOption?.verificationNoteEn}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Документ о праве собственности' : 'Ownership document'}</Label>
              <ImageUpload
                value={data.ownership_document_url}
                onChange={(url) => onChange({ 
                  ownership_document_url: url,
                  ownership_document_name: 'ownership-document'
                })}
                folder="ownership-documents"
                placeholder={isRu ? 'Загрузить документ (Chanote, свидетельство и т.д.)' : 'Upload document (Chanote, title deed, etc.)'}
              />
              {data.ownership_document_url && (
                <p className="text-sm text-success">
                  ✓ {isRu ? 'Документ загружен' : 'Document uploaded'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Upload for Management Agreement */}
      {showDocumentUpload && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {isRu ? 'Документ управления' : 'Management Document'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <FileSignature className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {isRu ? selectedOption?.verificationNoteRu : selectedOption?.verificationNoteEn}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Загрузите договор или доверенность' : 'Upload agreement or POA'}</Label>
              <ImageUpload
                value={data.management_document_url}
                onChange={(url) => onChange({ 
                  management_document_url: url,
                  management_document_name: 'document'
                })}
                folder="management-documents"
                placeholder={isRu ? 'Загрузить документ' : 'Upload document'}
              />
              {data.management_document_url && (
                <p className="text-sm text-success">
                  ✓ {isRu ? 'Документ загружен' : 'Document uploaded'}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="redacted"
                checked={data.commercial_terms_redacted}
                onCheckedChange={(checked) => onChange({ commercial_terms_redacted: !!checked })}
              />
              <label htmlFor="redacted" className="text-sm text-muted-foreground cursor-pointer">
                {isRu 
                  ? 'Коммерческие условия в документе скрыты' 
                  : 'Commercial terms are redacted in this document'}
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verbal Agreement Warning */}
      {isVerbalAgreement && (
        <Card className="border-muted">
          <CardContent className="pt-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {isRu ? 'Требуется подтверждение от собственника' : 'Owner confirmation required'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isRu ? selectedOption?.verificationNoteRu : selectedOption?.verificationNoteEn}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Owner Contact Fields */}
      {showOwnerFields && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {isRu ? 'Контактные данные собственника' : 'Owner Contact Information'}
              {!isVerbalAgreement && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({isRu ? 'опционально' : 'optional'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isVerbalAgreement
                ? (isRu 
                    ? 'Обязательно укажите контакты собственника для подтверждения ваших полномочий' 
                    : 'Owner contact details are required to verify your management rights')
                : (isRu 
                    ? 'Укажите контакты собственника для приглашения на платформу' 
                    : "Enter owner's contact details to invite them to the platform")
              }
            </p>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {isRu ? 'Имя собственника' : 'Owner Name'}
                {isVerbalAgreement && <span className="text-destructive">*</span>}
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
                {isVerbalAgreement && <span className="text-destructive">*</span>}
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
                {isRu ? 'Телефон собственника' : 'Owner Phone'}
                {isVerbalAgreement && <span className="text-destructive">*</span>}
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
                  {isRu ? 'Отправить приглашение собственнику' : 'Send invitation to owner'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu 
                    ? 'Собственник получит email с приглашением на платформу' 
                    : 'Owner will receive an email invitation to join the platform'}
                </p>
              </div>
              <Switch
                checked={data.send_invite_immediately}
                onCheckedChange={(checked) => onChange({ send_invite_immediately: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const OwnershipTypeStep = memo(OwnershipTypeStepInner);

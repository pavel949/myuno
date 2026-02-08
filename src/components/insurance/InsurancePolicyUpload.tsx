import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { Shield, Upload, FileCheck, LogIn, CalendarDays, Hash, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function InsurancePolicyUpload() {
  const { user } = useAuth();
  const { getDocument, createDocument } = useUserDocuments();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const existingPolicy = getDocument('insurance');

  const [fileUrl, setFileUrl] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Pre-fill if editing existing
  useEffect(() => {
    if (isEditing && existingPolicy) {
      setFileUrl(existingPolicy.file_url || '');
      setPolicyNumber(existingPolicy.document_number || '');
      setExpiryDate(existingPolicy.expiry_date || '');
    }
  }, [isEditing, existingPolicy]);

  const handleSave = () => {
    if (!fileUrl) return;
    createDocument.mutate({
      document_type: 'insurance',
      file_url: fileUrl,
      document_number: policyNumber || undefined,
      expiry_date: expiryDate || undefined,
    }, {
      onSuccess: () => setIsEditing(false),
    });
  };

  // Not logged in
  if (!user) {
    return (
      <Card variant="surface" className="border-primary/20">
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {isRu ? 'Уже купили страховку?' : 'Already bought insurance?'}
            </p>
          <p className="text-xs text-muted-foreground mt-1">
              {isRu
                ? 'Войдите, чтобы сохранить полис в myUNO. Мы поможем при страховом случае.'
                : "Sign in to save your policy in myUNO. We'll help you navigate claims."}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Has existing policy and not editing
  if (existingPolicy && !isEditing) {
    return (
      <Card variant="surface" className="border-emerald-500/30">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">
                  {isRu ? 'Полис загружен' : 'Policy Uploaded'}
                </p>
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                  ✓ {isRu ? 'Сохранён' : 'Saved'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                {existingPolicy.document_number && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {existingPolicy.document_number}
                  </span>
                )}
                {existingPolicy.expiry_date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {isRu ? 'до' : 'until'} {format(new Date(existingPolicy.expiry_date), 'dd.MM.yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {existingPolicy.file_url && (
            <a
              href={existingPolicy.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {isRu ? 'Открыть полис' : 'Open policy'}
            </a>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground">
              {isRu
                ? '🛟 При страховом случае — мы поможем на месте'
                : "🛟 We'll help you on-site during claims"}
            </p>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setIsEditing(true)}>
              {isRu ? 'Обновить' : 'Update'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Upload form (no policy yet OR editing)
  return (
    <Card variant="surface" className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {isRu ? 'Загрузите ваш полис' : 'Upload Your Policy'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRu
                ? 'Мы поможем с навигацией и коммуникацией при страховом случае'
                : "We'll assist with navigation & communication during claims"}
            </p>
          </div>
        </div>

        <UnifiedMediaUploader
          mode="document"
          value={fileUrl}
          onChange={(v) => setFileUrl(typeof v === 'string' ? v : v[0] || '')}
          folder="insurance-policies"
          bucket="user-documents"
          documentType="insurance"
          placeholder={isRu ? 'Загрузите PDF или фото полиса' : 'Upload PDF or photo of your policy'}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {isRu ? 'Номер полиса' : 'Policy number'}
            </label>
            <Input
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder={isRu ? 'Необязательно' : 'Optional'}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {isRu ? 'Действует до' : 'Valid until'}
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setIsEditing(false)}
            >
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={!fileUrl || createDocument.isPending}
          >
            <Shield className="w-4 h-4" />
            {createDocument.isPending
              ? (isRu ? 'Сохраняем...' : 'Saving...')
              : (isRu ? 'Сохранить полис' : 'Save Policy')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { FileText, Upload, Calendar, MapPin, Shield, Trash2, Eye, Plus, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, addMonths } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserDocuments, DocumentType, UserDocument } from '@/hooks/useUserDocuments';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

const DOCUMENT_TYPES: { type: DocumentType; labelEn: string; labelRu: string; icon: typeof FileText }[] = [
  { type: 'passport', labelEn: 'Passport', labelRu: 'Паспорт', icon: FileText },
  { type: 'driver_license', labelEn: 'Driver License', labelRu: 'Водительское удостоверение', icon: FileText },
  { type: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: Shield },
  { type: 'visa', labelEn: 'Visa', labelRu: 'Виза', icon: FileText },
  { type: 'other', labelEn: 'Other', labelRu: 'Другое', icon: FileText },
];

export default function MyDocuments() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { documents, isLoading, createDocument, deleteDocument, getDocument } = useUserDocuments();
  
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    document_number: '',
    country: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleEdit = (type: DocumentType) => {
    const existing = getDocument(type);
    setFormData({
      document_number: existing?.document_number || '',
      country: existing?.country || '',
      issue_date: existing?.issue_date || '',
      expiry_date: existing?.expiry_date || '',
      notes: existing?.notes || '',
    });
    setSelectedFile(null);
    setEditingType(type);
  };

  const handleSave = async () => {
    if (!editingType) return;
    
    await createDocument.mutateAsync({
      document_type: editingType,
      ...formData,
      file: selectedFile || undefined,
    });
    
    setEditingType(null);
  };

  const handleDelete = async (doc: UserDocument) => {
    if (confirm(isRu ? 'Удалить документ?' : 'Delete document?')) {
      await deleteDocument.mutateAsync(doc.id);
    }
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    return !isPast(expiryDate) && expiryDate < addMonths(new Date(), 3);
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return isPast(new Date(date));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title={isRu ? 'Мои документы' : 'My Documents'} showBack />
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Мои документы' : 'My Documents'} showBack />

      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 text-primary">
          <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            {isRu 
              ? 'Ваши документы надёжно защищены и доступны только вам. Они используются для упрощения бронирований.' 
              : 'Your documents are securely stored and only accessible by you. They help speed up bookings.'}
          </p>
        </div>

        {/* Document cards */}
        <div className="grid gap-4">
          {DOCUMENT_TYPES.map((docType) => {
            const doc = getDocument(docType.type);
            const Icon = docType.icon;
            const expired = doc && isExpired(doc.expiry_date);
            const expiringSoon = doc && isExpiringSoon(doc.expiry_date);

            return (
              <motion.div
                key={docType.type}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SectionCard 
                  className={cn(
                    "relative overflow-hidden",
                    expired && "border-destructive/50",
                    expiringSoon && "border-amber-500/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      doc ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn("w-6 h-6", doc ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {isRu ? docType.labelRu : docType.labelEn}
                        </h3>
                        {doc?.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs">
                            <Check className="w-3 h-3" />
                            {isRu ? 'Верифицирован' : 'Verified'}
                          </span>
                        )}
                        {expired && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {isRu ? 'Истёк' : 'Expired'}
                          </span>
                        )}
                        {expiringSoon && !expired && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            {isRu ? 'Истекает' : 'Expiring'}
                          </span>
                        )}
                      </div>

                      {doc ? (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {doc.document_number && (
                            <p>№ {doc.document_number}</p>
                          )}
                          {doc.country && (
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {doc.country}
                            </p>
                          )}
                          {doc.expiry_date && (
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {isRu ? 'Действ. до:' : 'Valid until:'} {format(new Date(doc.expiry_date), 'dd.MM.yyyy')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isRu ? 'Не добавлен' : 'Not added'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc?.file_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.file_url!, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {doc && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      <Button
                        variant={doc ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleEdit(docType.type)}
                      >
                        {doc ? (isRu ? 'Изменить' : 'Edit') : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            {isRu ? 'Добавить' : 'Add'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType && (isRu 
                ? DOCUMENT_TYPES.find(d => d.type === editingType)?.labelRu 
                : DOCUMENT_TYPES.find(d => d.type === editingType)?.labelEn)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{isRu ? 'Номер документа' : 'Document Number'}</Label>
              <Input
                value={formData.document_number}
                onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                placeholder={isRu ? 'Введите номер' : 'Enter number'}
              />
            </div>

            <div>
              <Label>{isRu ? 'Страна выдачи' : 'Country'}</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder={isRu ? 'Россия' : 'Russia'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRu ? 'Дата выдачи' : 'Issue Date'}</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>{isRu ? 'Срок действия' : 'Expiry Date'}</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>{isRu ? 'Файл (фото/скан)' : 'File (photo/scan)'}</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile?.name || (isRu ? 'Выбрать файл' : 'Choose file')}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div>
              <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isRu ? 'Дополнительная информация' : 'Additional info'}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingType(null)}
              >
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={createDocument.isPending}
              >
                {createDocument.isPending ? <LoadingSpinner size="sm" /> : (isRu ? 'Сохранить' : 'Save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

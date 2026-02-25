import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyDocuments, DocumentType, documentTypeLabels, PropertyDocument } from '@/hooks/usePropertyDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { toast } from 'sonner';
import { 
  Plus, FileText, Key, Copy, Eye, EyeOff, Trash2, Upload, 
  Calendar, AlertTriangle, CheckCircle, Lock, Wifi, 
  CreditCard, KeyRound, Radio, Shield, Building2
} from 'lucide-react';
import { format, isPast, addDays, isBefore } from 'date-fns';

interface PropertyDocumentsTabProps {
  propertyId: string;
}

const iconMap: Record<string, React.ElementType> = {
  FileText, Key, Lock, Wifi, CreditCard, KeyRound, Radio, Shield, Building2
};

export function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [showCode, setShowCode] = useState<Record<string, boolean>>({});

  const {
    documents,
    accessCodes,
    legalDocuments,
    isLoading,
    createDocument,
    deleteDocument,
    isCreating,
    isDeleting,
  } = usePropertyDocuments(propertyId);

  const [formData, setFormData] = useState({
    title: '',
    title_ru: '',
    description: '',
    access_code: '',
    access_instructions: '',
    issue_date: '',
    expiry_date: '',
    file_url: '',
    file_name: '',
  });

  const handleCreate = async () => {
    if (!selectedType) {
      toast.error(isRu ? 'Выберите тип документа' : 'Select document type');
      return;
    }
    if (!formData.title) {
      toast.error(isRu ? 'Введите название' : 'Enter title');
      return;
    }

    try {
      await createDocument.mutateAsync({
        property_id: propertyId,
        document_type: selectedType,
        ...formData,
        file_url: formData.file_url || undefined,
        file_name: formData.file_name || undefined,
        issue_date: formData.issue_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      });
      toast.success(isRu ? 'Документ добавлен' : 'Document added');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(isRu ? 'Ошибка при добавлении' : 'Failed to add');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm(isRu ? 'Удалить документ?' : 'Delete document?')) return;
    try {
      await deleteDocument.mutateAsync(docId);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    } catch (error) {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setFormData({
      title: '',
      title_ru: '',
      description: '',
      access_code: '',
      access_instructions: '',
      issue_date: '',
      expiry_date: '',
      file_url: '',
      file_name: '',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  const toggleShowCode = (docId: string) => {
    setShowCode(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const isAccessType = (type: DocumentType) => 
    ['door_code', 'safe_code', 'wifi_password', 'access_key_card', 'gate_remote'].includes(type);

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    if (isPast(expiry)) return 'expired';
    if (isBefore(expiry, addDays(new Date(), 30))) return 'expiring';
    return 'valid';
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Quick Access Codes */}
      {accessCodes && accessCodes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              {isRu ? 'Коды доступа' : 'Access Codes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accessCodes.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      {doc.document_type === 'wifi_password' ? (
                        <Wifi className="h-4 w-4 text-primary" />
                      ) : doc.document_type === 'door_code' ? (
                        <KeyRound className="h-4 w-4 text-primary" />
                      ) : doc.document_type === 'safe_code' ? (
                        <Lock className="h-4 w-4 text-primary" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isRu ? doc.title_ru || doc.title : doc.title}
                      </p>
                      {doc.access_code && (
                        <p className="text-sm font-mono text-muted-foreground">
                          {showCode[doc.id] ? doc.access_code : '••••••'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.access_code && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => toggleShowCode(doc.id)}
                        >
                          {showCode[doc.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => copyCode(doc.access_code!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">
              {isRu ? 'Все' : 'All'} ({documents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="legal">
              {isRu ? 'Юридические' : 'Legal'} ({legalDocuments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="access">
              {isRu ? 'Доступы' : 'Access'} ({accessCodes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Добавить' : 'Add'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isRu ? 'Добавить документ' : 'Add Document'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Тип документа' : 'Document Type'}</Label>
                  <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите тип' : 'Select type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {isRu ? label.ru : label.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRu ? 'Название' : 'Title'}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={isRu ? 'Напр. Код от главной двери' : 'E.g. Main door code'}
                  />
                </div>

                {isAccessType(selectedType as DocumentType) && (
                  <>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Код / Пароль' : 'Code / Password'}</Label>
                      <Input
                        value={formData.access_code}
                        onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                        placeholder="••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Инструкция' : 'Instructions'}</Label>
                      <Textarea
                        value={formData.access_instructions}
                        onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                        placeholder={isRu ? 'Как использовать...' : 'How to use...'}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {!isAccessType(selectedType as DocumentType) && selectedType && (
                  <>
                    <div className="space-y-2">
                      <Label>{isRu ? 'Описание' : 'Description'}</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{isRu ? 'Дата выдачи' : 'Issue Date'}</Label>
                        <Input
                          type="date"
                          value={formData.issue_date}
                          onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isRu ? 'Срок действия' : 'Expiry Date'}</Label>
                        <Input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* File upload - for all non-access document types */}
                {selectedType && !isAccessType(selectedType as DocumentType) && (
                  <div className="space-y-2">
                    <Label>{isRu ? 'Прикрепить файл' : 'Attach File'}</Label>
                    <UnifiedMediaUploader
                      mode="document"
                      value={formData.file_url}
                      onChange={(url) => {
                        const u = typeof url === 'string' ? url : '';
                        setFormData({ ...formData, file_url: u, file_name: u.split('/').pop() || '' });
                      }}
                      folder={`properties/${propertyId}/documents`}
                      placeholder={isRu ? 'PDF, фото, скан документа' : 'PDF, photo, document scan'}
                    />
                  </div>
                )}

                <Button onClick={handleCreate} disabled={isCreating} className="w-full">
                  {isCreating ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Сохранить' : 'Save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="all" className="mt-0">
          <DocumentList
            documents={documents || []}
            isRu={isRu}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="legal" className="mt-0">
          <DocumentList
            documents={legalDocuments || []}
            isRu={isRu}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </TabsContent>

        <TabsContent value="access" className="mt-0">
          <DocumentList
            documents={accessCodes || []}
            isRu={isRu}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DocumentListProps {
  documents: PropertyDocument[];
  isRu: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function DocumentList({ documents, isRu, onDelete, isDeleting }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{isRu ? 'Нет документов' : 'No documents'}</p>
      </div>
    );
  }

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    if (isPast(expiry)) return 'expired';
    if (isBefore(expiry, addDays(new Date(), 30))) return 'expiring';
    return 'valid';
  };

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const expiryStatus = getExpiryStatus(doc.expiry_date);
        const typeLabel = documentTypeLabels[doc.document_type];

        return (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {isRu ? doc.title_ru || doc.title : doc.title}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {isRu ? typeLabel.ru : typeLabel.en}
                  </Badge>
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {doc.description}
                  </p>
                )}
                {doc.expiry_date && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span className={`text-xs ${
                      expiryStatus === 'expired' ? 'text-destructive' :
                      expiryStatus === 'expiring' ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {expiryStatus === 'expired' && (isRu ? 'Истёк: ' : 'Expired: ')}
                      {expiryStatus === 'expiring' && (isRu ? 'Истекает: ' : 'Expires: ')}
                      {format(new Date(doc.expiry_date), 'dd.MM.yyyy')}
                    </span>
                    {expiryStatus === 'expired' && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {doc.is_verified && (
                <CheckCircle className="h-4 w-4 text-success mr-2" />
              )}
              {doc.file_url && (
                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(doc.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

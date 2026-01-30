import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { 
  useContentModeration, 
  ContentType, 
  ApprovalStatus, 
  PendingContent,
  allContentTypes,
  getContentTypeLabel
} from '@/hooks/useContentModeration';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Check, X, Eye, Clock, CheckCircle, XCircle, 
  Filter, RefreshCw, Building2, Calendar, MessageSquare, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminContentModeration() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { 
    pendingContent, 
    isLoading, 
    fetchPendingContent,
    approveContent,
    rejectContent,
    getContentDetails
  } = useContentModeration();

  const [activeTab, setActiveTab] = useState<ApprovalStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<PendingContent | null>(null);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRequestInfoDialogOpen, setIsRequestInfoDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestInfoMessage, setRequestInfoMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isRu = language === 'ru';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingContent(
        activeTab,
        typeFilter === 'all' ? undefined : typeFilter
      );
    }
  }, [isAdmin, activeTab, typeFilter, fetchPendingContent]);

  const handleViewDetails = async (item: PendingContent) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
    const details = await getContentDetails(item.content_type, item.id);
    setItemDetails(details);
  };

  const handleApprove = async (item: PendingContent) => {
    if (!user) return;
    setIsProcessing(true);
    const success = await approveContent(
      item.content_type, 
      item.id, 
      user.id,
      item.title,
      item.owner_user_id
    );
    if (success) {
      fetchPendingContent(activeTab, typeFilter === 'all' ? undefined : typeFilter);
      setIsViewDialogOpen(false);
    }
    setIsProcessing(false);
  };

  const handleOpenRejectDialog = (item: PendingContent) => {
    setSelectedItem(item);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleOpenRequestInfoDialog = (item: PendingContent) => {
    setSelectedItem(item);
    setRequestInfoMessage('');
    setIsRequestInfoDialogOpen(true);
  };

  const handleRequestInfo = async () => {
    if (!user || !selectedItem || !requestInfoMessage.trim()) return;
    setIsProcessing(true);
    
    // Set status to "needs_info" with the request message stored in rejection_reason field
    // This allows the vendor to see what info is needed
    const success = await rejectContent(
      selectedItem.content_type,
      selectedItem.id,
      user.id,
      `[ЗАПРОС ИНФОРМАЦИИ / INFO REQUEST]: ${requestInfoMessage}`,
      selectedItem.title,
      selectedItem.owner_user_id
    );
    
    if (success) {
      fetchPendingContent(activeTab, typeFilter === 'all' ? undefined : typeFilter);
      setIsRequestInfoDialogOpen(false);
      setIsViewDialogOpen(false);
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!user || !selectedItem) return;
    setIsProcessing(true);
    const success = await rejectContent(
      selectedItem.content_type, 
      selectedItem.id, 
      user.id, 
      rejectionReason,
      selectedItem.title,
      selectedItem.owner_user_id
    );
    if (success) {
      fetchPendingContent(activeTab, typeFilter === 'all' ? undefined : typeFilter);
      setIsRejectDialogOpen(false);
      setIsViewDialogOpen(false);
    }
    setIsProcessing(false);
  };

  const handleRefresh = () => {
    fetchPendingContent(activeTab, typeFilter === 'all' ? undefined : typeFilter);
  };

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />{isRu ? 'На модерации' : 'Pending'}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />{isRu ? 'Одобрено' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />{isRu ? 'Отклонено' : 'Rejected'}</Badge>;
    }
  };

  const pendingCount = pendingContent.filter(c => c.approval_status === 'pending').length;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Модерация контента' : 'Content Moderation'} 
          showBack 
        />

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={typeFilter} 
              onValueChange={(v) => setTypeFilter(v as ContentType | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRu ? 'Все типы' : 'All types'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все типы' : 'All types'}</SelectItem>
                {allContentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getContentTypeLabel(type, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRu ? 'Обновить' : 'Refresh'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApprovalStatus)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="relative">
              <Clock className="w-4 h-4 mr-2" />
              {isRu ? 'Ожидают' : 'Pending'}
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="w-4 h-4 mr-2" />
              {isRu ? 'Одобрено' : 'Approved'}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="w-4 h-4 mr-2" />
              {isRu ? 'Отклонено' : 'Rejected'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : pendingContent.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {activeTab === 'pending' ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                      <p className="text-muted-foreground">
                        {isRu ? 'Нет контента на модерации' : 'No pending content'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      {isRu ? 'Нет элементов' : 'No items'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingContent.map(item => (
                  <Card key={`${item.content_type}-${item.id}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Cover image */}
                        <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {item.cover_image ? (
                            <img 
                              src={item.cover_image} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium truncate">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {item.provider_name}
                              </p>
                            </div>
                            {getStatusBadge(item.approval_status)}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {getContentTypeLabel(item.content_type, language)}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(item.created_at), 'dd.MM.yyyy HH:mm')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                              className="text-xs px-2"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              {isRu ? 'Просмотр' : 'View'}
                            </Button>
                            
                            {activeTab === 'pending' && (
                              <>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2"
                                  onClick={() => handleApprove(item)}
                                  disabled={isProcessing}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  <span className="hidden xs:inline">{isRu ? 'Одобрить' : 'Approve'}</span>
                                  <span className="xs:hidden">✓</span>
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleOpenRejectDialog(item)}
                                  disabled={isProcessing}
                                  className="text-xs px-2"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  <span className="hidden xs:inline">{isRu ? 'Отклонить' : 'Reject'}</span>
                                  <span className="xs:hidden">✕</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedItem?.title}</DialogTitle>
              <DialogDescription>
                {selectedItem && getContentTypeLabel(selectedItem.content_type, language)}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[50vh]">
              {itemDetails ? (
                <div className="space-y-4">
                  {/* Cover image */}
                  {itemDetails.cover_image && (
                    <img 
                      src={itemDetails.cover_image} 
                      alt={selectedItem?.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

                  {/* Gallery */}
                  {itemDetails.images?.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {itemDetails.images.slice(0, 4).map((img: string, i: number) => (
                        <img 
                          key={i}
                          src={img} 
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{isRu ? 'Провайдер' : 'Provider'}:</span>
                      <p className="font-medium">{itemDetails.providers?.business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isRu ? 'Создано' : 'Created'}:</span>
                      <p className="font-medium">
                        {format(new Date(itemDetails.created_at), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                    {itemDetails.price && (
                      <div>
                        <span className="text-muted-foreground">{isRu ? 'Цена' : 'Price'}:</span>
                        <p className="font-medium">{itemDetails.price} {itemDetails.currency || 'THB'}</p>
                      </div>
                    )}
                    {itemDetails.address && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">{isRu ? 'Адрес' : 'Address'}:</span>
                        <p className="font-medium">{itemDetails.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {(itemDetails.description_en || itemDetails.description_ru) && (
                    <div>
                      <span className="text-muted-foreground text-sm">{isRu ? 'Описание' : 'Description'}:</span>
                      <p className="mt-1">
                        {isRu ? itemDetails.description_ru : itemDetails.description_en}
                      </p>
                    </div>
                  )}

                  {/* Rejection reason if rejected */}
                  {itemDetails.rejection_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-sm text-red-600 font-medium">
                        {isRu ? 'Причина отклонения:' : 'Rejection reason:'}
                      </span>
                      <p className="text-red-700 mt-1">{itemDetails.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                {isRu ? 'Закрыть' : 'Close'}
              </Button>
              
              {selectedItem?.approval_status === 'pending' && (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      if (selectedItem) handleOpenRequestInfoDialog(selectedItem);
                    }}
                    disabled={isProcessing}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {isRu ? 'Запросить инфо' : 'Request Info'}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (selectedItem) {
                        setIsViewDialogOpen(false);
                        handleOpenRejectDialog(selectedItem);
                      }
                    }}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-1" />
                    {isRu ? 'Отклонить' : 'Reject'}
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => selectedItem && handleApprove(selectedItem)}
                    disabled={isProcessing}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {isRu ? 'Одобрить' : 'Approve'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Отклонить контент' : 'Reject Content'}</DialogTitle>
              <DialogDescription>
                {isRu 
                  ? 'Укажите причину отклонения. Поставщик получит уведомление.'
                  : 'Please provide a reason for rejection. The vendor will be notified.'}
              </DialogDescription>
            </DialogHeader>

            <Textarea
              placeholder={isRu ? 'Причина отклонения...' : 'Rejection reason...'}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing}
              >
                <X className="w-4 h-4 mr-1" />
                {isRu ? 'Отклонить' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Info Dialog */}
        <Dialog open={isRequestInfoDialogOpen} onOpenChange={setIsRequestInfoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {isRu ? 'Запросить информацию' : 'Request Additional Information'}
              </DialogTitle>
              <DialogDescription>
                {isRu 
                  ? 'Опишите, какая информация или исправления необходимы. Поставщик получит уведомление и сможет внести изменения.'
                  : 'Describe what information or corrections are needed. The vendor will be notified and can make changes.'}
              </DialogDescription>
            </DialogHeader>

            <Textarea
              placeholder={isRu 
                ? 'Например: Добавьте больше фотографий, уточните адрес, исправьте описание...' 
                : 'E.g.: Add more photos, clarify the address, fix the description...'}
              value={requestInfoMessage}
              onChange={(e) => setRequestInfoMessage(e.target.value)}
              rows={5}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRequestInfoDialogOpen(false)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="default"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={handleRequestInfo}
                disabled={!requestInfoMessage.trim() || isProcessing}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {isRu ? 'Отправить запрос' : 'Send Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}

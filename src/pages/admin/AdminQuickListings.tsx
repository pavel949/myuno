import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, Check, X, ChevronRight, Clock, Phone, Mail, 
  MapPin, User, Loader2, ArrowUpRight, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencySymbol } from '@/lib/config/currencies';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';

import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickListing {
  id: string;
  user_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  category: string;
  subcategory: string | null;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  images: string[] | null;
  location: string | null;
  status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  property: { en: 'Property', ru: 'Недвижимость' },
  service: { en: 'Service', ru: 'Услуга' },
  product: { en: 'Product', ru: 'Товар' },
  experience: { en: 'Experience', ru: 'Впечатление' },
};

const SUBCATEGORY_LABELS: Record<string, { en: string; ru: string }> = {
  villa: { en: 'Villa', ru: 'Вилла' },
  apartment: { en: 'Apartment', ru: 'Квартира' },
  condo: { en: 'Condo', ru: 'Кондо' },
  beauty: { en: 'Beauty & Spa', ru: 'Красота и SPA' },
  clinic: { en: 'Medical', ru: 'Медицина' },
  fitness: { en: 'Fitness', ru: 'Фитнес' },
  education: { en: 'Education', ru: 'Образование' },
  tour: { en: 'Tour', ru: 'Экскурсия' },
  yacht: { en: 'Yacht', ru: 'Яхта' },
  activity: { en: 'Activity', ru: 'Активность' },
  event: { en: 'Event', ru: 'Мероприятие' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  flowers: { en: 'Flowers', ru: 'Цветы' },
  transport: { en: 'Transport', ru: 'Транспорт' },
  cleaning: { en: 'Cleaning', ru: 'Уборка' },
  babysitter: { en: 'Babysitting', ru: 'Няни' },
  pets: { en: 'Pet Services', ru: 'Для питомцев' },
  legal: { en: 'Legal', ru: 'Юридические' },
  pharmacy: { en: 'Pharmacy', ru: 'Аптека' },
};

export default function AdminQuickListings() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [listings, setListings] = useState<QuickListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedListing, setSelectedListing] = useState<QuickListing | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      fetchListings();
    }
  }, [isAdmin, activeTab]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quick_listings')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (listing: QuickListing) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('quick_listings')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', listing.id);

      if (error) throw error;

      toast.success(language === 'ru' ? 'Заявка одобрена' : 'Listing approved');
      fetchListings();
      setSelectedListing(null);
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error(language === 'ru' ? 'Ошибка при одобрении' : 'Failed to approve');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedListing || !rejectionReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('quick_listings')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', selectedListing.id);

      if (error) throw error;

      toast.success(language === 'ru' ? 'Заявка отклонена' : 'Listing rejected');
      fetchListings();
      setSelectedListing(null);
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error(language === 'ru' ? 'Ошибка при отклонении' : 'Failed to reject');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: language === 'ru' ? 'На модерации' : 'Pending' },
      approved: { variant: 'default', label: language === 'ru' ? 'Одобрено' : 'Approved' },
      rejected: { variant: 'destructive', label: language === 'ru' ? 'Отклонено' : 'Rejected' },
      converted: { variant: 'outline', label: language === 'ru' ? 'Конвертировано' : 'Converted' },
    };
    const { variant, label } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <PageHeader 
        title={language === 'ru' ? 'Быстрые заявки' : 'Quick Listings'}
        showBack
        fallbackPath="/admin"
      />
      
      <div className="p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="pending">
              {language === 'ru' ? 'Новые' : 'Pending'}
            </TabsTrigger>
            <TabsTrigger value="approved">
              {language === 'ru' ? 'Одобрены' : 'Approved'}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {language === 'ru' ? 'Отклонены' : 'Rejected'}
            </TabsTrigger>
            <TabsTrigger value="converted">
              {language === 'ru' ? 'Готовы' : 'Converted'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'ru' ? 'Нет заявок' : 'No listings'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card 
                key={listing.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedListing(listing)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[listing.category]?.[language === 'ru' ? 'ru' : 'en'] || listing.category}
                        </Badge>
                        {listing.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {SUBCATEGORY_LABELS[listing.subcategory]?.[language === 'ru' ? 'ru' : 'en'] || listing.subcategory}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {listing.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {listing.contact_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {listing.contact_name}
                          </span>
                        )}
                        {listing.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(listing.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(listing.created_at), 'dd.MM.yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    {listing.price && (
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {getCurrencySymbol(listing.currency || 'THB')}
                          {listing.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedListing && !showRejectDialog} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedListing?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {CATEGORY_LABELS[selectedListing.category]?.[language === 'ru' ? 'ru' : 'en']}
                </Badge>
                {selectedListing.subcategory && (
                  <Badge variant="outline">
                    {SUBCATEGORY_LABELS[selectedListing.subcategory]?.[language === 'ru' ? 'ru' : 'en']}
                  </Badge>
                )}
                {getStatusBadge(selectedListing.status)}
              </div>

              {selectedListing.description && (
                <p className="text-muted-foreground">{selectedListing.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedListing.price && (
                  <div>
                    <span className="text-muted-foreground">{language === 'ru' ? 'Цена:' : 'Price:'}</span>
                    <p className="font-semibold">
                      {selectedListing.currency === 'THB' ? '฿' : selectedListing.currency === 'USD' ? '$' : '€'}
                      {selectedListing.price.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedListing.location && (
                  <div>
                    <span className="text-muted-foreground">{language === 'ru' ? 'Локация:' : 'Location:'}</span>
                    <p className="font-semibold flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedListing.location}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">{language === 'ru' ? 'Контактные данные' : 'Contact Info'}</h4>
                <div className="space-y-2 text-sm">
                  {selectedListing.contact_name && (
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {selectedListing.contact_name}
                    </p>
                  )}
                  {selectedListing.contact_phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedListing.contact_phone}`} className="text-primary hover:underline">
                        {selectedListing.contact_phone}
                      </a>
                    </p>
                  )}
                  {selectedListing.contact_email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${selectedListing.contact_email}`} className="text-primary hover:underline">
                        {selectedListing.contact_email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {selectedListing.rejection_reason && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    {language === 'ru' ? 'Причина отклонения:' : 'Rejection reason:'}
                  </p>
                  <p className="text-sm">{selectedListing.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {selectedListing?.status === 'pending' && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Отклонить' : 'Reject'}
              </Button>
              <Button
                className="gradient-gold text-primary-foreground"
                onClick={() => selectedListing && handleApprove(selectedListing)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {language === 'ru' ? 'Одобрить' : 'Approve'}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Причина отклонения' : 'Rejection Reason'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={language === 'ru' ? 'Укажите причину...' : 'Enter reason...'}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                language === 'ru' ? 'Отклонить' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

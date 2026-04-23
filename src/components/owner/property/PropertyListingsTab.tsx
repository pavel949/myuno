import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useInventoryListings, useCreateInventoryListing, useDeleteInventoryListing, LISTING_TYPES, LISTING_TYPE_LABELS, AVAILABILITY_STATUS_LABELS } from '@/hooks/useInventoryListings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Plus, Trash2, X, Eye, MessageSquare, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: string;
  companyId: string;
}

function formatPrice(price: number | null) {
  if (!price) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(price);
}

export function PropertyListingsTab({ propertyId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { data: listings = [], isLoading } = useInventoryListings(propertyId);
  const createListing = useCreateInventoryListing();
  const deleteListing = useDeleteInventoryListing();

  const [showAdd, setShowAdd] = useState(false);
  const [listingType, setListingType] = useState('sale');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('THB');

  const handleAdd = async () => {
    try {
      await createListing.mutateAsync({
        property_id: propertyId,
        listing_type: listingType,
        price: price ? Number(price) : null,
        currency,
        company_id: companyId,
        created_by: user?.id || null,
      });
      toast.success(isRu ? 'Листинг создан' : 'Listing created');
      setShowAdd(false);
      setPrice('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteListing.mutateAsync({ id, propertyId });
      toast.success(isRu ? 'Удалён' : 'Deleted');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{isRu ? 'Листинги' : 'Listings'} ({listings.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-1" />}
          {showAdd ? '' : (isRu ? 'Добавить' : 'Add Listing')}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-none border p-3 space-y-3 bg-card">
          <div>
            <Label>{isRu ? 'Тип листинга' : 'Listing Type'}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {LISTING_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setListingType(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border transition-colors',
                    listingType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
                  )}
                >
                  {isRu ? LISTING_TYPE_LABELS[t].ru : LISTING_TYPE_LABELS[t].en}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Цена' : 'Price'}</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['THB', 'USD', 'EUR', 'RUB'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={createListing.isPending}>
            {isRu ? 'Создать' : 'Create'}
          </Button>
        </div>
      )}

      {listings.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground py-6 text-center">{isRu ? 'Нет активных листингов' : 'No active listings'}</p>
      )}

      <div className="space-y-2">
        {listings.map(l => {
          const statusInfo = AVAILABILITY_STATUS_LABELS[l.availability_status] || AVAILABILITY_STATUS_LABELS.available;
          return (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-none border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isRu ? LISTING_TYPE_LABELS[l.listing_type]?.ru : LISTING_TYPE_LABELS[l.listing_type]?.en}
                  </span>
                  <StatusPill status={statusInfo.status as any}>
                    {isRu ? statusInfo.ru : statusInfo.en}
                  </StatusPill>
                  {l.exclusive && <StatusPill status="premium" dot={false}>Exclusive</StatusPill>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatPrice(l.price)} {l.currency}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{l.viewing_count}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{l.inquiry_count}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(l.id)} className="p-1 rounded-none hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

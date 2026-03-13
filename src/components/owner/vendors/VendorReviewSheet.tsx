import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCompanyId } from '@/hooks/useAgentDeals';
import { useCreateVendorReview } from '@/hooks/useVendorReviews';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface VendorReviewSheetProps {
  vendorId: string;
  vendorName: string;
  propertyId?: string;
  taskId?: string;
  trigger?: React.ReactNode;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
            <Star className={`h-5 w-5 ${s <= value ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function VendorReviewSheet({ vendorId, vendorName, propertyId, taskId, trigger }: VendorReviewSheetProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { data: company } = useMyCompanyId();
  const createReview = useCreateVendorReview();
  const [open, setOpen] = useState(false);
  const [quality, setQuality] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [notes, setNotes] = useState('');

  const overall = quality && speed && communication ? Math.round(((quality + speed + communication) / 3) * 10) / 10 : 0;

  const handleSubmit = async () => {
    if (!company?.company_id || !user) return;
    if (!quality || !speed || !communication) { toast.error(isRu ? 'Оцените все категории' : 'Rate all categories'); return; }
    try {
      await createReview.mutateAsync({
        company_id: company.company_id, vendor_id: vendorId, property_id: propertyId, task_id: taskId,
        quality_score: quality, speed_score: speed, communication_score: communication, overall_score: overall,
        notes: notes || undefined, reviewed_by: user.id,
      });
      toast.success(isRu ? 'Оценка сохранена' : 'Review saved');
      setOpen(false); setQuality(0); setSpeed(0); setCommunication(0); setNotes('');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Error'); }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" size="sm">
            <Star className="h-4 w-4 mr-1" />{isRu ? 'Оценить' : 'Review'}
          </Button>
        )}
      </div>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={isRu ? `Оценка: ${vendorName}` : `Review: ${vendorName}`}
        icon={<Star className="w-5 h-5 text-warning" />}
        size="sm"
        footer={
          <Button className="w-full" onClick={handleSubmit} disabled={createReview.isPending}>
            {isRu ? 'Сохранить оценку' : 'Submit Review'}
          </Button>
        }
      >
        <StarRating value={quality} onChange={setQuality} label={isRu ? 'Качество работы' : 'Quality'} />
        <StarRating value={speed} onChange={setSpeed} label={isRu ? 'Скорость' : 'Speed'} />
        <StarRating value={communication} onChange={setCommunication} label={isRu ? 'Коммуникация' : 'Communication'} />
        {overall > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="font-semibold text-sm">{isRu ? 'Итого' : 'Overall'}</span>
            <span className="font-bold text-lg">{overall} / 5</span>
          </div>
        )}
        <div>
          <Label>{isRu ? 'Комментарий' : 'Notes'}</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>
      </ResponsiveModal>
    </>
  );
}
